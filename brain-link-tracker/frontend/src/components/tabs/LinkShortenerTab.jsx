import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Link2, 
  Scissors, 
  Copy, 
  ExternalLink,
  BarChart3,
  Globe,
  Plus
} from 'lucide-react'

export default function LinkShortenerTab() {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortenedLinks] = useState([
    {
      id: 1,
      original: 'https://example.com/very-long-url-that-needs-shortening',
      shortened: 'short.ly/abc123',
      alias: 'abc123',
      clicks: 0,
      created: new Date().toISOString()
    }
  ])

  const handleShorten = () => {
    // Placeholder function - will be implemented in future
    console.log('Shortening URL:', url, 'with alias:', customAlias)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scissors className="h-6 w-6 md:h-8 md:w-8 text-cyan-500" />
            Link Shortener
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Create short, memorable links without tracking</p>
        </div>
        
        <Badge variant="secondary" className="w-fit">
          Coming Soon
        </Badge>
      </div>

      {/* URL Shortener Form */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Shorten URL
          </CardTitle>
          <CardDescription>Create shortened links for easy sharing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="original-url">Original URL</Label>
            <Input
              id="original-url"
              placeholder="https://example.com/your-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled
            />
          </div>
          
          <div>
            <Label htmlFor="custom-alias">Custom Alias (Optional)</Label>
            <Input
              id="custom-alias"
              placeholder="my-custom-link"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for auto-generated alias
            </p>
          </div>
          
          <Button onClick={handleShorten} className="w-full" disabled>
            <Scissors className="h-4 w-4 mr-2" />
            Shorten URL
          </Button>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              Simple Shortening
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Convert long URLs into short, shareable links without any tracking or analytics.
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              Custom Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use your own custom domain for branded short links that match your business.
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Basic Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View basic click statistics without detailed tracking or user identification.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Links Preview */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Recent Shortened Links
          </CardTitle>
          <CardDescription>Your recently created short links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shortenedLinks.map((link) => (
              <div key={link.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {link.shortened}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`https://${link.shortened}`)}
                      className="h-6 w-6 p-0"
                      disabled
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{link.original}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold">{link.clicks}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(link.created).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Features Notice */}
      <Card className="border-dashed border-2">
        <CardContent className="p-8 md:p-12 text-center">
          <Scissors className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">Link Shortener Coming Soon</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            A simple URL shortening service without tracking capabilities will be available in future updates. 
            Perfect for creating clean, shareable links when you don't need detailed analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Custom Aliases</Badge>
            <Badge variant="outline">Custom Domains</Badge>
            <Badge variant="outline">Bulk Shortening</Badge>
            <Badge variant="outline">QR Codes</Badge>
            <Badge variant="outline">Link Expiration</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

