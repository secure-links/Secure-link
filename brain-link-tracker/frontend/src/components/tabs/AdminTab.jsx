import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UserCog, 
  Users, 
  Database, 
  Server, 
  Settings,
  Plus,
  Shield,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react'

export default function AdminTab() {
  const [systemStats] = useState({
    total_users: 1,
    total_links: 0,
    total_clicks: 0,
    database_size: '2.4 MB',
    server_uptime: '99.9%',
    memory_usage: '45%',
    cpu_usage: '12%',
    disk_usage: '23%'
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 md:h-8 md:w-8 text-pink-500" />
            Admin Panel
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">System administration and user management</p>
        </div>
        
        <Badge variant="secondary" className="w-fit">
          Coming Soon
        </Badge>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                <p className="text-lg md:text-2xl font-bold">{systemStats.total_users}</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Database Size</p>
                <p className="text-lg md:text-2xl font-bold">{systemStats.database_size}</p>
              </div>
              <Database className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Server Uptime</p>
                <p className="text-lg md:text-2xl font-bold">{systemStats.server_uptime}</p>
              </div>
              <Server className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-lg md:text-2xl font-bold">{systemStats.memory_usage}</p>
              </div>
              <MemoryStick className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* User Management */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Create New User</p>
                  <p className="text-sm text-muted-foreground">Add new admin users</p>
                </div>
                <Button disabled variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">User Permissions</p>
                  <p className="text-sm text-muted-foreground">Manage access levels</p>
                </div>
                <Button disabled variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Advanced system configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Database Management</p>
                  <p className="text-sm text-muted-foreground">Backup and maintenance</p>
                </div>
                <Button disabled variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">System Logs</p>
                  <p className="text-sm text-muted-foreground">View application logs</p>
                </div>
                <Button disabled variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
          <CardDescription>Monitor server resources and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-lg font-bold">{systemStats.cpu_usage}</p>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <MemoryStick className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-bold">{systemStats.memory_usage}</p>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-lg font-bold">{systemStats.disk_usage}</p>
              <p className="text-sm text-muted-foreground">Disk Usage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Features Notice */}
      <Card className="border-dashed border-2">
        <CardContent className="p-8 md:p-12 text-center">
          <UserCog className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">Admin Features Coming Soon</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Advanced user management, system configuration, and administrative tools will be available in future updates.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">User Management</Badge>
            <Badge variant="outline">Role-based Access</Badge>
            <Badge variant="outline">System Monitoring</Badge>
            <Badge variant="outline">Database Tools</Badge>
            <Badge variant="outline">Audit Logs</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

