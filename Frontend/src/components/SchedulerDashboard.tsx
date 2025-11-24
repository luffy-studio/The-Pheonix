import React, { useState, useEffect } from 'react';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  BookOpen,
  Calendar,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/context/AuthContext';
const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ScheduleAnalytics {
  generation_method: string;
  teacher_workload: Record<string, TeacherWorkload>;
  validation_issues: string[];
  schedule_stats: {
    total_classes: number;
    total_periods_scheduled: number;
    unique_subjects: number;
    unique_teachers: number;
    average_periods_per_class: number;
  };
  efficiency_metrics: Record<string, any>;
}

interface TeacherWorkload {
  current_load: number;
  max_capacity: number;
  utilization_percent: number;
  subjects_taught: number;
  workload_status?: 'overloaded' | 'optimal' | 'underutilized' | 'good';
}

const SchedulerDashboard: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [teacherWorkload, setTeacherWorkload] = useState<Record<string, TeacherWorkload>>({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isLoggedIn) {
      loadAnalytics();
    }
  }, [isLoggedIn]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      // Load analytics
      const analyticsResponse = await axios.get(`${backend}/scheduler/analytics/${userId}`);
      if (analyticsResponse.data.status === 'success') {
        setAnalytics(analyticsResponse.data.data);
      }

      // Load teacher workload
      const workloadResponse = await axios.get(`${backend}/scheduler/teacher-workload/${userId}`);
      if (workloadResponse.data.status === 'success') {
        setTeacherWorkload(workloadResponse.data.data);
      }

      // Load conflicts
      const conflictsResponse = await axios.get(`${backend}/scheduler/conflicts/${userId}`);
      if (conflictsResponse.data.status === 'success') {
        setConflicts(conflictsResponse.data.conflicts || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeSchedule = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await axios.post(`${backend}/scheduler/optimize/${userId}`);
      if (response.data.status === 'success') {
        alert('Schedule optimized successfully! Refreshing analytics...');
        loadAnalytics();
      }
    } catch (error: any) {
      alert('Error optimizing schedule: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadStatusColor = (status?: string) => {
    switch (status) {
      case 'overloaded': return 'destructive';
      case 'optimal': return 'default';
      case 'good': return 'secondary';
      case 'underutilized': return 'outline';
      default: return 'secondary';
    }
  };

  const getWorkloadStatusIcon = (status?: string) => {
    switch (status) {
      case 'overloaded': return <AlertTriangle className="w-4 h-4" />;
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'underutilized': return <Clock className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <div>Please log in to view scheduler analytics.</div>
        </Alert>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading scheduler analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <BookOpen className="h-4 w-4" />
          <div>No schedule analytics available. Generate a timetable first.</div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduler Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Advanced analytics and optimization for your timetable
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            {analytics.generation_method === 'smart_scheduler' ? 'Smart Scheduler' : 'Legacy Method'}
          </Badge>
          <button
            onClick={optimizeSchedule}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Optimize</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold">{analytics.schedule_stats?.total_classes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Periods</p>
                <p className="text-2xl font-bold">{analytics.schedule_stats?.total_periods_scheduled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Subjects</p>
                <p className="text-2xl font-bold">{analytics.schedule_stats?.unique_subjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Teachers</p>
                <p className="text-2xl font-bold">{analytics.schedule_stats?.unique_teachers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Issues Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-semibold">Schedule Conflicts Detected</h4>
            <ul className="mt-2 list-disc list-inside">
              {conflicts.slice(0, 3).map((conflict, index) => (
                <li key={index} className="text-sm">{conflict}</li>
              ))}
              {conflicts.length > 3 && (
                <li className="text-sm">...and {conflicts.length - 3} more issues</li>
              )}
            </ul>
          </div>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workload">Teacher Workload</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Schedule Efficiency</span>
                </CardTitle>
                <CardDescription>
                  Overview of your timetable efficiency metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Periods per Class</span>
                      <span>{analytics.schedule_stats?.average_periods_per_class || 0}</span>
                    </div>
                    <Progress
                      value={(analytics.schedule_stats?.average_periods_per_class || 0) * 10}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Teacher Utilization</span>
                      <span>
                        {Object.values(teacherWorkload).length > 0
                          ? Math.round(Object.values(teacherWorkload).reduce((acc, teacher) => acc + teacher.utilization_percent, 0) / Object.values(teacherWorkload).length)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={Object.values(teacherWorkload).length > 0
                        ? Object.values(teacherWorkload).reduce((acc, teacher) => acc + teacher.utilization_percent, 0) / Object.values(teacherWorkload).length
                        : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Schedule Quality</span>
                </CardTitle>
                <CardDescription>
                  Quality metrics and validation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conflicts Detected</span>
                    <Badge variant={conflicts.length > 0 ? "destructive" : "default"}>
                      {conflicts.length} issues
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Schedule Method</span>
                    <Badge variant="outline">
                      {analytics.generation_method === 'smart_scheduler' ? 'Smart' : 'Legacy'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Quality</span>
                    <Badge variant={conflicts.length === 0 ? "default" : "secondary"}>
                      {conflicts.length === 0 ? 'Excellent' : 'Needs Review'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Workload Distribution</CardTitle>
              <CardDescription>
                Detailed breakdown of teaching assignments and capacity utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(teacherWorkload).map(([teacherName, workload]) => (
                  <div key={teacherName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {teacherName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{teacherName}</h4>
                          <p className="text-sm text-gray-600">
                            {workload.subjects_taught} subjects assigned
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getWorkloadStatusIcon(workload.workload_status)}
                        <Badge variant={getWorkloadStatusColor(workload.workload_status)}>
                          {workload.workload_status || 'unknown'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Workload: {workload.current_load}/{workload.max_capacity} hours</span>
                        <span>{workload.utilization_percent}%</span>
                      </div>
                      <Progress
                        value={workload.utilization_percent}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Optimization</CardTitle>
              <CardDescription>
                Tools and recommendations to improve your timetable efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Optimization Recommendations */}
                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {conflicts.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <div>Resolve {conflicts.length} scheduling conflicts for better efficiency.</div>
                      </Alert>
                    )}

                    {Object.values(teacherWorkload).some(t => t.workload_status === 'overloaded') && (
                      <Alert variant="destructive">
                        <Users className="h-4 w-4" />
                        <div>Some teachers are overloaded. Consider redistributing workload.</div>
                      </Alert>
                    )}

                    {Object.values(teacherWorkload).some(t => t.workload_status === 'underutilized') && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <div>Some teachers are underutilized. Consider assigning more classes.</div>
                      </Alert>
                    )}

                    {conflicts.length === 0 && !Object.values(teacherWorkload).some(t => t.workload_status === 'overloaded') && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <div>Your schedule looks great! No major issues detected.</div>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Optimization Actions */}
                <div>
                  <h4 className="font-semibold mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={optimizeSchedule}
                      disabled={loading}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                        <div>
                          <h5 className="font-medium">Re-optimize Schedule</h5>
                          <p className="text-sm text-gray-600">Apply latest optimizations</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={loadAnalytics}
                      disabled={loading}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <div>
                          <h5 className="font-medium">Refresh Analytics</h5>
                          <p className="text-sm text-gray-600">Update all metrics</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchedulerDashboard;