import React from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Twitter, Github, ExternalLink } from 'lucide-react';

interface SocialLinksDetailSectionProps {
    entity: Record<string, any>;
}

export default function SocialLinksDetailSection({ entity }: SocialLinksDetailSectionProps) {
    const socialLinks = entity.extension_data?.social_links || {};
    
    const hasAnyLink = socialLinks.linkedin || socialLinks.twitter || socialLinks.github;
    
    if (!hasAnyLink) {
        return null;
    }

    const links = [
        { 
            key: 'linkedin', 
            icon: Linkedin, 
            label: 'LinkedIn', 
            color: 'text-[#0077b5] hover:bg-[#0077b5]/10',
            url: socialLinks.linkedin 
        },
        { 
            key: 'twitter', 
            icon: Twitter, 
            label: 'Twitter/X', 
            color: 'text-[#1da1f2] hover:bg-[#1da1f2]/10',
            url: socialLinks.twitter 
        },
        { 
            key: 'github', 
            icon: Github, 
            label: 'GitHub', 
            color: 'text-foreground hover:bg-muted',
            url: socialLinks.github 
        },
    ].filter(link => link.url);

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Social Links</h4>
            
            <div className="flex flex-wrap gap-2">
                {links.map(({ key, icon: Icon, label, color, url }) => (
                    <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className={`gap-2 ${color}`}
                        asChild
                    >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <Icon className="h-4 w-4" />
                            {label}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                    </Button>
                ))}
            </div>
        </div>
    );
}
