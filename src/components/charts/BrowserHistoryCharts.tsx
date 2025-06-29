import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Globe,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Smartphone
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { useDataStore } from '../../store/dataStore'
import { BrowserHistoryAnalyzer, BrowserAnalytics } from '../../utils/browserHistoryAnalyzer'
import { DeviceWiseBrowserCharts } from './DeviceWiseBrowserCharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export const BrowserHistoryCharts: React.FC = () => {
  const { getPageData } = useDataStore()
  const data = getPageData('browserHistory')
  const deviceData = getPageData('deviceInfo')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  console.log('🔍 BrowserHistoryCharts: Data state:', {
    hasData: !!data,
    hasDeviceData: !!deviceData,
    dataType: data?.type,
    totalRecords: data?.metadata?.totalRecords
  })

  const analytics = useMemo(() => {
    if (!data?.data) {
      console.log('❌ No browser history data available for analysis')
      return null
    }

    console.log('📊 Starting browser history analysis...')
    console.log('📊 Data structure:', {
      type: typeof data.data,
      isArray: Array.isArray(data.data),
      keys: typeof data.data === 'object' && !Array.isArray(data.data) ? Object.keys(data.data) : 'not object',
      sampleData: Array.isArray(data.data) ? data.data[0] : data.data
    })
    
    try {
      const analyzer = new BrowserHistoryAnalyzer(data.data)
      
      if (!analyzer.hasValidData()) {
        console.log('❌ Analyzer reports no valid data. Data structure:', data.data)
        return null
      }
      
      console.log('✅ Analyzer has valid data, running analysis...')
      const result = analyzer.analyze()
      console.log('✅ Analysis complete:', {
        topDomainsCount: result.topDomains.length,
        topSitesCount: result.topSites.length,
        dailyActivityCount: result.dailyActivity.length,
        totalVisits: result.totalStats.totalVisits
      })
      
      return result
    } catch (error) {
      console.error('❌ Error during browser history analysis:', error)
      console.error('❌ Data that caused error:', data.data)
      return null
    }
  }, [data])

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No data uploaded</CardTitle>
            <CardDescription>Upload your browser history data to see visualizations.</CardDescription>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics && data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">Unable to process data</CardTitle>
            <CardDescription>
              The browser history data format is not recognized. Please ensure you've uploaded a valid browser history file.
            </CardDescription>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded text-yellow-700 dark:text-yellow-300 text-sm">
              <p className="font-semibold mb-2">Expected formats:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Chrome visits.json export</li>
                <li>Browser history JSON with visit records</li>
                <li>Array of visit objects with URL and timestamp</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <p className="text-xs font-semibold">Debug Info:</p>
                <p className="text-xs">File: {data.fileName}</p>
                <p className="text-xs">Records: {data.metadata.totalRecords}</p>
                <p className="text-xs">Type: {data.type}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No valid data found</CardTitle>
            <CardDescription>
              Please upload a valid browser history file to see your browsing analytics.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalStats, topDomains, topSites, dailyActivity, hourlyActivity, weeklyPattern, sessions } = analytics

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🌐 Total Visits</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Browsing sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📊 Unique Sites</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalSites.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Different websites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🏢 Domains</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalDomains}</div>
            <p className="text-xs text-muted-foreground">Unique domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📈 Avg/Site</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgVisitsPerSite.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Visits per site</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="domains">🏢 Domains</TabsTrigger>
          <TabsTrigger value="activity">📅 Activity</TabsTrigger>
          <TabsTrigger value="patterns">🕐 Patterns</TabsTrigger>
          <TabsTrigger value="sessions">⏱️ Sessions</TabsTrigger>
          <TabsTrigger value="devices">📱 Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 Daily Browsing Activity</CardTitle>
                <CardDescription>Your browsing activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dailyActivity.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏆 Top Domains</CardTitle>
                <CardDescription>Most visited websites</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topDomains.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="domain" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visitCount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🕐 Hourly Activity Pattern</CardTitle>
              <CardDescription>When you browse the most throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🏢 Top Domains by Visits</CardTitle>
                <CardDescription>Most frequently visited domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topDomains.slice(0, 10).map((domain, index) => (
                    <div key={domain.domain} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{domain.domain}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{domain.visitCount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{domain.urls.length} pages</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Domain Distribution</CardTitle>
                <CardDescription>Visit distribution across top domains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={topDomains.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ domain, visitCount }) => `${domain}: ${visitCount}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="visitCount"
                    >
                      {topDomains.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📅 Weekly Activity Pattern</CardTitle>
              <CardDescription>Your browsing habits by day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 Recent Activity Trend</CardTitle>
                <CardDescription>Last 30 days of browsing</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyActivity.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Activity Summary</CardTitle>
                <CardDescription>Key browsing statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Most Active Day</span>
                  <Badge variant="outline">
                    {weeklyPattern.reduce((max, day) => day.visits > max.visits ? day : max, weeklyPattern[0]).day}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Peak Hour</span>
                  <Badge variant="outline">
                    {hourlyActivity.reduce((max, hour) => hour.visits > max.visits ? hour : max, hourlyActivity[0]).hour}:00
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Most Typed Site</span>
                  <Badge variant="outline" className="max-w-32 truncate">
                    {totalStats.mostTypedSite}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Sessions</span>
                  <Badge variant="outline">{sessions.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🕐 Hourly Browsing Pattern</CardTitle>
                <CardDescription>Activity distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Browsing Insights</CardTitle>
                <CardDescription>Patterns in your browsing behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">🌅 Morning (6-12)</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {hourlyActivity.slice(6, 12).reduce((sum, h) => sum + h.visits, 0).toLocaleString()} visits
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">☀️ Afternoon (12-18)</h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {hourlyActivity.slice(12, 18).reduce((sum, h) => sum + h.visits, 0).toLocaleString()} visits
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">🌙 Evening (18-24)</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    {hourlyActivity.slice(18, 24).reduce((sum, h) => sum + h.visits, 0).toLocaleString()} visits
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⏱️ Session Analysis</CardTitle>
              <CardDescription>Understanding your browsing sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{sessions.length}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60000) : 0}m
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.pageCount, 0) / sessions.length) : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Pages/Session</p>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sessions.slice(0, 10).map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.pageCount} pages • {Math.round(session.duration / 60000)}m duration
                      </p>
                    </div>
                    <Badge variant="outline">
                      Session {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <DeviceWiseBrowserCharts deviceData={deviceData?.data} browserData={data?.data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}