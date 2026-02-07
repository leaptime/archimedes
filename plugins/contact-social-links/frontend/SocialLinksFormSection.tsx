import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Linkedin, Twitter, Github } from 'lucide-react';

interface SocialLinksFormSectionProps {
    data: Record<string, any>;
    setData: (data: any) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
}

export default function SocialLinksFormSection({ 
    data, 
    setData, 
    errors = {}, 
    disabled = false 
}: SocialLinksFormSectionProps) {
    // Social links are stored in extension_data JSON field
    const socialLinks = data.extension_data?.social_links || {};

    const updateSocialLink = (network: string, value: string) => {
        setData({
            ...data,
            extension_data: {
                ...data.extension_data,
                social_links: {
                    ...socialLinks,
                    [network]: value,
                },
            },
        });
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Social Links</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LinkedIn */}
                <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#0077b5]" />
                        LinkedIn
                    </Label>
                    <Input
                        id="linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={socialLinks.linkedin || ''}
                        onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                        disabled={disabled}
                    />
                    {errors['extension_data.social_links.linkedin'] && (
                        <p className="text-sm text-destructive">
                            {errors['extension_data.social_links.linkedin']}
                        </p>
                    )}
                </div>

                {/* Twitter/X */}
                <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-[#1da1f2]" />
                        Twitter/X
                    </Label>
                    <Input
                        id="twitter"
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={socialLinks.twitter || ''}
                        onChange={(e) => updateSocialLink('twitter', e.target.value)}
                        disabled={disabled}
                    />
                    {errors['extension_data.social_links.twitter'] && (
                        <p className="text-sm text-destructive">
                            {errors['extension_data.social_links.twitter']}
                        </p>
                    )}
                </div>

                {/* GitHub */}
                <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        GitHub
                    </Label>
                    <Input
                        id="github"
                        type="url"
                        placeholder="https://github.com/..."
                        value={socialLinks.github || ''}
                        onChange={(e) => updateSocialLink('github', e.target.value)}
                        disabled={disabled}
                    />
                    {errors['extension_data.social_links.github'] && (
                        <p className="text-sm text-destructive">
                            {errors['extension_data.social_links.github']}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
