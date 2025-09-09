"use client"

import { Button } from "@/components/ui/button"
import { Share2, Copy, Facebook, Twitter, Linkedin } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

interface QuickShareButtonsProps {
  profileUrl: string
  sellerName: string
  sellerTitle: string
  onOpenModal: () => void
}

export function QuickShareButtons({ profileUrl, sellerName, sellerTitle, onOpenModal }: QuickShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `Check out ${sellerName}'s profile - ${sellerTitle}`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(profileUrl)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const shareToSocial = (platform: string) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    }

    window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400")
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copyLink} className="flex items-center gap-2 bg-transparent">
        <Copy className="h-4 w-4" />
        {copied ? "Copied!" : "Copy Link"}
      </Button>

      <Button variant="outline" size="sm" onClick={() => shareToSocial("facebook")} className="flex items-center gap-2">
        <Facebook className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={() => shareToSocial("twitter")} className="flex items-center gap-2">
        <Twitter className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={() => shareToSocial("linkedin")} className="flex items-center gap-2">
        <Linkedin className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={onOpenModal} className="flex items-center gap-2 bg-transparent">
        <Share2 className="h-4 w-4" />
        More
      </Button>
    </div>
  )
}
