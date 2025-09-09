"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Facebook, Twitter, Linkedin, Mail, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProfileShareModalProps {
  isOpen: boolean
  onClose: () => void
  profileUrl: string
  sellerName: string
  sellerTitle: string
}

export function ProfileShareModal({ isOpen, onClose, profileUrl, sellerName, sellerTitle }: ProfileShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)

  const shareText = `Check out ${sellerName}'s profile - ${sellerTitle}`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(profileUrl)

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedText}&body=Check out this profile: ${profileUrl}`,
  }

  const embedCode = `<iframe src="${profileUrl}/embed" width="400" height="600" frameborder="0"></iframe>`

  const copyToClipboard = async (text: string, type: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "link") {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        setEmbedCopied(true)
        setTimeout(() => setEmbedCopied(false), 2000)
      }
      toast({
        title: "Copied!",
        description: `${type === "link" ? "Profile link" : "Embed code"} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = () => {
    // In a real app, you'd use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={profileUrl} readOnly />
              <Button size="sm" onClick={() => copyToClipboard(profileUrl, "link")} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(socialLinks.facebook, "_blank")}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(socialLinks.twitter, "_blank")}
                className="flex items-center gap-2"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(socialLinks.linkedin, "_blank")}
                className="flex items-center gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(socialLinks.email, "_blank")}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <img src={generateQRCode() || "/placeholder.svg"} alt="QR Code" className="border rounded-lg" />
              <p className="text-sm text-muted-foreground text-center">Scan this QR code to view the profile</p>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Embed Code</label>
              <div className="flex items-start space-x-2">
                <textarea
                  value={embedCode}
                  readOnly
                  className="flex-1 min-h-[100px] px-3 py-2 text-sm border rounded-md resize-none"
                />
                <Button size="sm" onClick={() => copyToClipboard(embedCode, "embed")} className="shrink-0">
                  {embedCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Copy this code to embed the profile on your website</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
