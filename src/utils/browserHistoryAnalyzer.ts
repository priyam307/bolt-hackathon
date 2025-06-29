export interface ChromeVisit {
  // Enhanced interface to handle Chrome export format
  url: string
  title: string
  visitTime: string | number
  visitDuration?: number
  visitCount?: number
  timestamp?: number
  visit_time?: number
  last_visit_time?: number
  typed_count?: number
  visit_count?: number
  transition?: number
  from_visit?: number
  segment_id?: number
  hidden?: number
  id?: number
  time_usec?: number
}

export interface DomainStats {
  domain: string
  visitCount: number
  totalTime: number
  lastVisit: Date
  urls: string[]
  typedCount: number
}

export interface SessionData {
  startTime: Date
  endTime: Date
  duration: number
  pageCount: number
  urls: string[]
}

export interface TimeBasedUrlStats {
  url: string
  title: string
  domain: string
  visitsByHour: { [hour: number]: number }
  visitsByDayOfWeek: { [day: number]: number }
  totalVisits: number
  peakHour: number
  peakDay: string
}

export interface BrowserAnalytics {
  topDomains: DomainStats[]
  topSites: { url: string; title: string; visitCount: number; domain: string; typedCount: number }[]
  sessions: SessionData[]
  dailyActivity: { date: string; visits: number; duration: number }[]
  hourlyActivity: { hour: number; visits: number; avgDuration: number }[]
  weeklyPattern: { day: string; visits: number; avgDuration: number }[]
  timeBasedUrls: TimeBasedUrlStats[]
  hourlyUrlDistribution: { hour: number; topUrls: { url: string; title: string; visits: number }[] }[]
  browsingSessions: { date: string; sessions: number; avgSessionLength: number }[]
  totalStats: {
    totalVisits: number
    totalSites: number
    totalDomains: number
    avgVisitsPerSite: number
    mostTypedSite: string
  }
}

export class BrowserHistoryAnalyzer {
  private visits: ChromeVisit[] = []

  constructor(data: any) {
    const startTime = Date.now()
    console.log('🔍 === BROWSER HISTORY ANALYZER INITIALIZATION ===');
    console.log('🔍 Input data type:', typeof data, 'isArray:', Array.isArray(data));
    console.log('🔍 Input data sample:', Array.isArray(data) ? data.slice(0, 2) : data);
    
    if (!data) {
      console.log('❌ No data provided to BrowserHistoryAnalyzer');
      this.visits = []
      return
    }
    
    // Log the structure we're working with
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      console.log('🔍 Object keys found:', Object.keys(data));
    }
    
    this.visits = this.parseVisits(data)
    const endTime = Date.now()
    console.log('✅ Final parsed visits count:', this.visits.length)
    console.log('✅ Data validation result:', this.hasValidData())
    
    if (this.visits.length > 0) {
      console.log('✅ Sample visit:', {
        url: this.visits[0].url,
        title: this.visits[0].title,
        timestamp: this.visits[0].timestamp,
        parsedDate: new Date(this.visits[0].timestamp || 0)
      })
    }
    
    // Log summary for debugging
    const summary = this.getDataSummary()
    console.log('📊 Data summary:', summary)
    console.log(`⏱️ Initialization took ${endTime - startTime}ms`)
  }
  
  public hasValidData(): boolean {
    return this.visits.length > 0
  }
  
  public getDataSummary() {
    return {
      totalVisits: this.visits.length,
      dateRange: this.visits.length > 0 ? {
        earliest: new Date(Math.min(...this.visits.map(v => v.timestamp || 0))),
        latest: new Date(Math.max(...this.visits.map(v => v.timestamp || 0)))
      } : null,
      uniqueUrls: new Set(this.visits.map(v => v.url)).size,
      uniqueDomains: new Set(this.visits.map(v => this.extractDomain(v.url))).size
    }
  }

  private parseVisits(data: any): ChromeVisit[] {
    console.log('🔍 === PARSING VISITS ===');
    const parseStartTime = Date.now()
    if (!data) return []
    
    let visits: any[] = []
    
    // Log the exact structure we're working with
    console.log('🔍 Raw data structure:', {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : 'not object',
      length: Array.isArray(data) ? data.length : 'not array',
      sample: Array.isArray(data) ? data[0] : typeof data === 'object' ? Object.values(data)[0] : data
    })
    
    // PRIORITY: Handle Chrome visits.json format specifically
    console.log('🔍 Checking for Chrome visits format...');
    // Chrome exports often have this exact structure
    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0]
      console.log('🔍 Direct array sample:', sample);
      
      // Check if this looks like Chrome history format
      if (sample && typeof sample === 'object') {
        const hasUrl = !!(sample.url || sample.URL)
        const hasTime = !!(sample.time_usec || sample.last_visit_time || sample.visit_time)
        const hasTitle = !!(sample.title || sample.page_title)
        const hasId = !!(sample.id)
        const hasVisitCount = !!(sample.visit_count !== undefined)
        
        console.log('🔍 Chrome format detection:', { hasUrl, hasTime, hasTitle, hasId, hasVisitCount });
        
        // More lenient detection - if it has URL or time, it's likely browser history
        if (hasUrl || hasTime || hasId) {
          console.log('✅ Detected Chrome visits format in direct array');
          console.log('✅ Sample Chrome visit:', sample);
          visits = data
        }
      }
    }
    
    // Handle nested ZIP/Takeout structures
    if (visits.length === 0 && typeof data === 'object' && !Array.isArray(data)) {
      console.log('🔍 Searching nested structures for browser history...');
      
      // Check for common Takeout file patterns
      const possibleFiles = [
        'chrome-visits.json',
        'BrowserHistory.json',
        'History.json',
        'visits.json'
      ]
      
      for (const fileName of possibleFiles) {
        if (data[fileName]) {
          console.log(`✅ Found browser history file: ${fileName}`);
          const fileData = data[fileName]
          if (Array.isArray(fileData)) {
            console.log(`✅ Using data from ${fileName}:`, fileData.length, 'items');
            visits = fileData
            break
          }
        }
      }
      
      // Check for files ending with common patterns
      if (visits.length === 0) {
        for (const [fileName, fileData] of Object.entries(data)) {
          if (typeof fileName === 'string' && Array.isArray(fileData)) {
            const lowerFileName = fileName.toLowerCase()
            if (lowerFileName.includes('visit') || 
                lowerFileName.includes('history') || 
                lowerFileName.includes('browser') ||
                lowerFileName.includes('chrome')) {
              console.log(`✅ Found potential browser history file: ${fileName}`);
              
              // Validate it looks like browser data
              if (fileData.length > 0 && fileData[0]) {
                const sample = fileData[0]
                const hasUrl = !!(sample.url || sample.URL)
                const hasTime = !!(sample.time_usec || sample.last_visit_time || sample.visit_time)
                
                if (hasUrl || hasTime) {
                  console.log(`✅ Using data from ${fileName}:`, fileData.length, 'items');
                  visits = fileData
                  break
                }
              }
            }
          }
        }
      }
    }
    
    // If we found visits in direct array, skip other checks
    if (visits.length > 0) {
      console.log('✅ Using direct array with', visits.length, 'items');
    }
    // Handle direct array (most common for chrome-visits.json)
    else if (Array.isArray(data)) {
      console.log('✅ Data is direct array with', data.length, 'items');
      visits = data
    }
    // Handle nested structures
    else if (typeof data === 'object' && data !== null) {
      console.log('🔍 Searching object for visit arrays...');
      
      // Check for common patterns in Chrome exports
      const possibleKeys = [
        'visits', 'history', 'browsing_history', 'browser_history',
        'urls', 'sites', 'pages', 'records', 'entries', 'items',
        'Browser History', 'browserHistory', 'chromeHistory'
      ]
      
      // First, try direct keys
      for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
          console.log(`✅ Found visits array at key "${key}":`, data[key].length, 'items');
          visits = data[key]
          break
        }
      }
      
      // If no direct match, check nested structures
      if (visits.length === 0) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const nestedKey of possibleKeys) {
              if (value[nestedKey] && Array.isArray(value[nestedKey])) {
                console.log(`✅ Found visits array at nested key "${key}.${nestedKey}":`, value[nestedKey].length, 'items');
                visits = value[nestedKey]
                break
              }
            }
            if (visits.length > 0) break
          }
        }
      }
      
      // If still no match, find the largest array that looks like browser data
      if (visits.length === 0) {
        console.log('🔍 No direct matches, searching for browser-like arrays...');
        
        const findBrowserArray = (obj: any): any[] => {
          if (Array.isArray(obj) && obj.length > 0) {
            const sample = obj[0]
            if (typeof sample === 'object' && sample !== null) {
              // Check if it looks like browser history
              const hasUrl = sample.url || sample.URL || sample.uri || sample.href
              const hasTime = sample.time_usec || sample.last_visit_time || sample.visit_time || sample.timestamp
              const hasTitle = sample.title || sample.page_title
              
              if (hasUrl || (hasTime && hasTitle)) {
                console.log('✅ Found browser-like array with', obj.length, 'items');
                return obj
              }
            }
          }
          
          if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
              const result = findBrowserArray(value)
              if (result.length > 0) return result
            }
          }
          
          return []
        }
        
        visits = findBrowserArray(data)
      }
    }

    console.log('🔍 Raw visits found:', visits.length);
    if (visits.length > 0) {
      console.log('🔍 Sample raw visit:', visits[0]);
      
      // Add timeout protection for large datasets
      if (visits.length > 50000) {
        console.log('⚠️ Large dataset detected, limiting to first 50000 visits for performance');
        visits = visits.slice(0, 50000)
      }
      console.log('🔍 Raw visit keys:', Object.keys(visits[0] || {}));
    } else {
      console.log('❌ No visits found in data structure. Available keys:', 
        typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : 'not object')
    }

    // Process and filter visits
    const processedVisits = visits
      .filter(visit => {
        if (!visit || typeof visit !== 'object') {
          console.log('❌ Filtered out non-object visit:', typeof visit);
          return false
        }
        return true
      })
      .map(visit => {
        // Only log first few visits to avoid spam
        if (processedVisits.length < 3) {
          console.log('🔍 Processing visit:', { url: visit?.url, time_usec: visit?.time_usec, id: visit?.id });
        }
        
        // Extract time with priority order for Chrome data
        const visitTime = visit.time_usec || 
                         visit.last_visit_time || 
                         visit.visit_time || 
                         visit.visitTime || 
                         visit.timestamp || 
                         visit.time ||
                         visit.date ||
                         Date.now()
        
        if (processedVisits.length < 3) {
          console.log('🔍 Extracted visit time:', visitTime, 'from visit:', visit?.url);
        }
      
        const processedVisit = {
          url: visit.url || visit.URL || visit.uri || visit.href || visit.link || '',
          title: visit.title || visit.Title || visit.name || visit.page_title || visit.url || '',
          visitTime: visitTime,
          visitDuration: visit.visitDuration || visit.duration || 0,
          visitCount: visit.visit_count || visit.visitCount || visit.count || 1,
          typedCount: visit.typed_count || visit.typedCount || visit.typed || 0,
          timestamp: this.parseTimestamp(visitTime),
          id: visit.id,
          hidden: visit.hidden,
          time_usec: visit.time_usec
        }
      
        if (processedVisits.length < 3) {
          console.log('🔍 Processed visit result:', { url: processedVisit.url, timestamp: processedVisit.timestamp });
        }
        
        return processedVisit
      })
      .filter(visit => {
        // Validate URL
        if (!visit.url || typeof visit.url !== 'string') {
          if (processedVisits.length < 10) {
            console.log('❌ Invalid URL:', visit.url);
          }
          return false
        }
        
        // More lenient URL validation for Chrome data
        const hasValidUrl = visit.url && visit.url.length > 0 && (
          visit.url.startsWith('http') || 
          visit.url.startsWith('https') ||
          visit.url.startsWith('www') || 
          visit.url.includes('.') ||
          visit.url.includes('://') ||
          visit.url.length > 5
        )
        
        if (!hasValidUrl) {
          if (processedVisits.length < 10) {
            console.log('❌ Invalid URL format:', visit.url, 'length:', visit.url?.length);
          }
          return false
        }
        
        // Validate timestamp
        const hasValidTimestamp = visit.timestamp && 
          visit.timestamp > 0 && 
          !isNaN(visit.timestamp) &&
          visit.timestamp > 946684800000 // After year 2000
        
        if (!hasValidTimestamp) {
          if (processedVisits.length < 10) {
            console.log('❌ Invalid timestamp:', visit.timestamp, 'original:', visit.visitTime, 'for URL:', visit.url);
          }
          return false
        }
        
        if (processedVisits.length < 3) {
          console.log('✅ Valid visit:', { url: visit.url.substring(0, 50), timestamp: visit.timestamp });
        }
        return true
      })
    
    console.log(`⏱️ Parsing took ${Date.now() - parseStartTime}ms`)
    console.log('✅ Final processed visits count:', processedVisits.length);
    if (processedVisits.length > 0) {
      console.log('✅ Sample processed visit:', processedVisits[0]);
    }
    return processedVisits
  }

  private parseTimestamp(time: any): number {
    console.log('🕐 Parsing timestamp:', time, 'type:', typeof time);
    
    // Add validation to prevent infinite loops
    if (time === null || time === undefined) {
      console.log('🕐 Null/undefined timestamp, using current time');
      return Date.now()
    }
    
    if (typeof time === 'number') {
      // Handle Chrome timestamp (microseconds since January 1, 1601 UTC)
      if (time > 10000000000000) {
        console.log('🕐 Converting Chrome timestamp:', time);
        // Convert Chrome timestamp to JavaScript timestamp
        const CHROME_EPOCH_OFFSET = 11644473600000000; // microseconds
        const jsTimestamp = Math.floor((time - CHROME_EPOCH_OFFSET) / 1000)
        console.log('🕐 Chrome timestamp converted:', time, '->', jsTimestamp);
        return jsTimestamp
      }
      // Handle Unix timestamp in milliseconds
      if (time > 1000000000000) {
        console.log('🕐 Unix timestamp (ms):', time, '->', new Date(time));
        return time
      }
      // Handle Unix timestamp in seconds
      if (time > 1000000000) {
        const converted = time * 1000
        console.log('🕐 Unix timestamp (s) converted:', time, '->', converted, '->', new Date(converted));
        return time * 1000
      }
      // For small numbers, might be relative time - use current time
      console.log('🕐 Small number timestamp, using current time for:', time);
      const currentTime = Date.now()
      return currentTime
    }
    if (typeof time === 'string') {
      const parsed = new Date(time).getTime()
      console.log('🕐 String timestamp parsed:', time, '->', parsed);
      return isNaN(parsed) ? Date.now() : parsed
    }
    console.log('🕐 Fallback to current time for:', time);
    const fallbackTime = Date.now()
    return fallbackTime
  }

  private extractDomain(url: string): string {
    if (!url || typeof url !== 'string') {
      return 'unknown'
    }
    
    try {
      if (!url.startsWith('http') && !url.startsWith('//')) {
        if (url.startsWith('www.')) {
          url = 'https://' + url
        } else if (url.includes('.')) {
          url = 'https://' + url
        } else {
          return 'unknown'
        }
      }
      
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '')
    } catch {
      return 'unknown'
    }
  }

  private analyzeTimeBasedUrls(): TimeBasedUrlStats[] {
    const urlTimeMap = new Map<string, {
      url: string
      title: string
      domain: string
      visitsByHour: { [hour: number]: number }
      visitsByDayOfWeek: { [day: number]: number }
      totalVisits: number
    }>()

    this.visits.forEach(visit => {
      const visitDate = new Date(visit.timestamp || 0)
      const hour = visitDate.getHours()
      const dayOfWeek = visitDate.getDay()
      
      const existing = urlTimeMap.get(visit.url) || {
        url: visit.url,
        title: visit.title,
        domain: this.extractDomain(visit.url),
        visitsByHour: {},
        visitsByDayOfWeek: {},
        totalVisits: 0
      }

      existing.visitsByHour[hour] = (existing.visitsByHour[hour] || 0) + 1
      existing.visitsByDayOfWeek[dayOfWeek] = (existing.visitsByDayOfWeek[dayOfWeek] || 0) + 1
      existing.totalVisits += 1

      urlTimeMap.set(visit.url, existing)
    })

    return Array.from(urlTimeMap.values())
      .filter(stats => stats.totalVisits > 1)
      .map(stats => {
        const peakHour = Object.entries(stats.visitsByHour)
          .reduce((max, [hour, visits]) => visits > max.visits ? { hour: parseInt(hour), visits } : max, { hour: 0, visits: 0 }).hour
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const peakDayIndex = Object.entries(stats.visitsByDayOfWeek)
          .reduce((max, [day, visits]) => visits > max.visits ? { day: parseInt(day), visits } : max, { day: 0, visits: 0 }).day
        
        return {
          ...stats,
          peakHour,
          peakDay: dayNames[peakDayIndex]
        }
      })
      .sort((a, b) => b.totalVisits - a.totalVisits)
      .slice(0, 20)
  }

  private analyzeHourlyUrlDistribution(): { hour: number; topUrls: { url: string; title: string; visits: number }[] }[] {
    const hourlyUrlMap = new Map<number, Map<string, { url: string; title: string; visits: number }>>()

    this.visits.forEach(visit => {
      const hour = new Date(visit.timestamp || 0).getHours()
      
      if (!hourlyUrlMap.has(hour)) {
        hourlyUrlMap.set(hour, new Map())
      }
      
      const hourMap = hourlyUrlMap.get(hour)!
      const existing = hourMap.get(visit.url) || { url: visit.url, title: visit.title, visits: 0 }
      existing.visits += 1
      hourMap.set(visit.url, existing)
    })

    return Array.from({ length: 24 }, (_, hour) => {
      const hourMap = hourlyUrlMap.get(hour) || new Map()
      const topUrls = Array.from(hourMap.values())
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5)
      
      return { hour, topUrls }
    })
  }

  private groupVisitsBySession(visits: ChromeVisit[], sessionGapMinutes = 30): SessionData[] {
    if (visits.length === 0) return []

    const sortedVisits = [...visits]
      .filter(visit => visit.timestamp && visit.timestamp > 0)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    
    if (sortedVisits.length === 0) return []
    
    const sessions: SessionData[] = []
    let currentSession: ChromeVisit[] = [sortedVisits[0]]

    for (let i = 1; i < sortedVisits.length; i++) {
      const currentVisit = sortedVisits[i]
      const lastVisit = currentSession[currentSession.length - 1]
      
      const timeDiffMs = (currentVisit.timestamp || 0) - (lastVisit.timestamp || 0)
      const timeDiffMinutes = timeDiffMs / (1000 * 60)

      if (timeDiffMinutes <= sessionGapMinutes && timeDiffMinutes >= 0) {
        currentSession.push(currentVisit)
      } else {
        if (currentSession.length > 0) {
          sessions.push(this.createSessionData(currentSession))
        }
        currentSession = [currentVisit]
      }
    }

    if (currentSession.length > 0) {
      sessions.push(this.createSessionData(currentSession))
    }

    return sessions
  }

  private createSessionData(visits: ChromeVisit[]): SessionData {
    if (visits.length === 0) {
      return {
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        pageCount: 0,
        urls: []
      }
    }
    
    const sortedVisits = visits.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    const startTime = new Date(sortedVisits[0].timestamp || 0)
    const endTime = new Date(sortedVisits[sortedVisits.length - 1].timestamp || 0)
    
    let duration = endTime.getTime() - startTime.getTime()
    
    if (duration < 60000) {
      duration = Math.max(visits.length * 30000, 60000)
    }

    return {
      startTime,
      endTime,
      duration,
      pageCount: visits.length,
      urls: visits.map(v => v.url).filter(url => url)
    }
  }

  private analyzeBrowsingSessionsOverTime(): { date: string; sessions: number; avgSessionLength: number }[] {
    const sessions = this.groupVisitsBySession(this.visits)
    const dailySessionMap = new Map<string, { sessions: number; totalDuration: number }>()

    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0]
      const existing = dailySessionMap.get(date) || { sessions: 0, totalDuration: 0 }
      existing.sessions += 1
      existing.totalDuration += session.duration
      dailySessionMap.set(date, existing)
    })

    return Array.from(dailySessionMap.entries())
      .map(([date, stats]) => ({
        date,
        sessions: stats.sessions,
        avgSessionLength: stats.sessions > 0 ? stats.totalDuration / stats.sessions : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  analyze(): BrowserAnalytics {
    console.log('🔍 === STARTING ANALYSIS ===');
    const analysisStartTime = Date.now()
    
    // Add early validation with detailed logging
    if (!this.hasValidData()) {
      console.log('❌ No valid data available for analysis');
      return this.getEmptyAnalytics()
    }
    
    console.log('✅ Analyzing', this.visits.length, 'visits');
    
    // Add performance monitoring
    if (this.visits.length > 10000) {
      console.log('⚠️ Large dataset analysis - this may take a moment...');
    }
    
    // Log sample visits for debugging
    console.log('📊 Sample visits for analysis:');
    this.visits.slice(0, 3).forEach((visit, index) => {
      console.log(`📊 Visit ${index + 1}:`, { url: visit.url, timestamp: visit.timestamp, date: new Date(visit.timestamp || 0) });
    });
    
    // Analyze top domains
    console.log('🔍 Analyzing domains...');
    const domainMap = new Map<string, DomainStats>()
    
    this.visits.forEach(visit => {
      const domain = this.extractDomain(visit.url)
      if (domain === 'unknown') return
      
      const existing = domainMap.get(domain) || {
        domain,
        visitCount: 0,
        totalTime: 0,
        lastVisit: new Date(0),
        urls: [],
        typedCount: 0
      }

      existing.visitCount += visit.visitCount || 1
      existing.totalTime += visit.visitDuration || 0
      existing.typedCount += visit.typedCount || 0
      existing.lastVisit = new Date(Math.max(existing.lastVisit.getTime(), visit.timestamp || 0))
      if (!existing.urls.includes(visit.url)) {
        existing.urls.push(visit.url)
      }

      domainMap.set(domain, existing)
    })

    const topDomains = Array.from(domainMap.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 20)

    // Analyze top sites
    console.log('🔍 Analyzing sites...');
    const siteMap = new Map<string, { url: string; title: string; visitCount: number; domain: string; typedCount: number }>()
    
    this.visits.forEach(visit => {
      const existing = siteMap.get(visit.url) || {
        url: visit.url,
        title: visit.title,
        visitCount: 0,
        domain: this.extractDomain(visit.url),
        typedCount: 0
      }
      existing.visitCount += visit.visitCount || 1
      existing.typedCount += visit.typedCount || 0
      siteMap.set(visit.url, existing)
    })

    const topSites = Array.from(siteMap.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 20)

    // Analyze sessions
    console.log('🔍 Analyzing sessions...');
    const sessions = this.groupVisitsBySession(this.visits)

    // Daily activity
    console.log('🔍 Analyzing daily activity...');
    const dailyMap = new Map<string, { visits: number; duration: number }>()
    this.visits.forEach(visit => {
      console.log('📊 Processing visit for daily activity:', { url: visit.url, timestamp: visit.timestamp });
      if (!visit.timestamp || visit.timestamp <= 0) return
      
      const visitDate = new Date(visit.timestamp)
      if (isNaN(visitDate.getTime())) return
      
      const date = visitDate.toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { visits: 0, duration: 0 }
      console.log('📊 Adding to daily activity:', { date, existingVisits: existing.visits });
      existing.visits += visit.visitCount || 1
      existing.duration += visit.visitDuration || 0
      dailyMap.set(date, existing)
    })

    const dailyActivity = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(activity => activity.date && activity.visits > 0)

    console.log('📊 Generated daily activity:', dailyActivity.length, 'entries');
    // Hourly activity
    console.log('🔍 Analyzing hourly activity...');
    const hourlyMap = new Map<number, { visits: number; totalDuration: number }>()
    this.visits.forEach(visit => {
      if (!visit.timestamp || visit.timestamp <= 0) return
      const visitDate = new Date(visit.timestamp)
      if (isNaN(visitDate.getTime())) return
      
      const hour = visitDate.getHours()
      if (isNaN(hour)) return
      
      const existing = hourlyMap.get(hour) || { visits: 0, totalDuration: 0 }
      existing.visits += visit.visitCount || 1
      existing.totalDuration += visit.visitDuration || 0
      hourlyMap.set(hour, existing)
    })

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const stats = hourlyMap.get(hour) || { visits: 0, totalDuration: 0 }
      return {
        hour,
        visits: stats.visits,
        avgDuration: stats.visits > 0 ? stats.totalDuration / stats.visits : 0
      }
    })
    
    console.log('📊 Generated hourly activity:', hourlyActivity.filter(h => h.visits > 0).length, 'active hours');

    // Weekly pattern
    console.log('🔍 Analyzing weekly patterns...');
    console.log('📊 Generating weekly pattern...');
    const weeklyMap = new Map<number, { visits: number; totalDuration: number }>()
    this.visits.forEach(visit => {
      if (!visit.timestamp || visit.timestamp <= 0) return
      const visitDate = new Date(visit.timestamp)
      if (isNaN(visitDate.getTime())) return
      
      const dayOfWeek = visitDate.getDay()
      if (isNaN(dayOfWeek)) return
      
      const existing = weeklyMap.get(dayOfWeek) || { visits: 0, totalDuration: 0 }
      existing.visits += visit.visitCount || 1
      existing.totalDuration += visit.visitDuration || 0
      weeklyMap.set(dayOfWeek, existing)
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weeklyPattern = dayNames.map((day, index) => {
      const stats = weeklyMap.get(index) || { visits: 0, totalDuration: 0 }
      return {
        day,
        visits: stats.visits,
        avgDuration: stats.visits > 0 ? stats.totalDuration / stats.visits : 0
      }
    })
    console.log('📊 Generated weekly pattern:', weeklyPattern.map(w => ({ day: w.day, visits: w.visits })));

    // Advanced analyses
    console.log('🔍 Running advanced analyses...');
    const timeBasedUrls = this.analyzeTimeBasedUrls()
    const hourlyUrlDistribution = this.analyzeHourlyUrlDistribution()
    const browsingSessions = this.analyzeBrowsingSessionsOverTime()

    // Calculate total stats
    const totalVisits = this.visits.reduce((sum, visit) => sum + (visit.visitCount || 1), 0)
    const totalSites = new Set(this.visits.map(v => v.url)).size
    const totalDomains = topDomains.length
    const avgVisitsPerSite = totalSites > 0 ? totalVisits / totalSites : 0
    const mostTypedSite = topSites.reduce((max, site) => 
      site.typedCount > max.typedCount ? site : max, 
      { typedCount: 0, url: 'None' }
    ).url

    const result = {
      topDomains,
      topSites,
      sessions,
      dailyActivity,
      hourlyActivity,
      weeklyPattern,
      timeBasedUrls,
      hourlyUrlDistribution,
      browsingSessions,
      totalStats: {
        totalVisits,
        totalSites,
        totalDomains,
        avgVisitsPerSite,
        mostTypedSite
      }
    }
    
    console.log(`⏱️ Total analysis took ${Date.now() - analysisStartTime}ms`)
    console.log('📊 Final analysis stats:', { totalVisits, totalSites, totalDomains });
    console.log('✅ Analysis complete:', {
      dailyActivityCount: result.dailyActivity.length,
      hourlyActivityCount: result.hourlyActivity.length,
      totalVisits: result.totalStats.totalVisits,
      totalSites: result.totalStats.totalSites
    });
    
    return result
  }
  
  private getEmptyAnalytics(): BrowserAnalytics {
    return {
      topDomains: [],
      topSites: [],
      sessions: [],
      dailyActivity: [],
      hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({ hour, visits: 0, avgDuration: 0 })),
      weeklyPattern: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        .map(day => ({ day, visits: 0, avgDuration: 0 })),
      timeBasedUrls: [],
      hourlyUrlDistribution: [],
      browsingSessions: [],
      totalStats: {
        totalVisits: 0,
        totalSites: 0,
        totalDomains: 0,
        avgVisitsPerSite: 0,
        mostTypedSite: 'None'
      }
    }
  }
}