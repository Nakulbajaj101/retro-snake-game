import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings, User, Ghost, Skull, Smile } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function ProfileSettings() {
    const { theme, setTheme } = useTheme()
    const { user, updateUser } = useAuth()

    // Initialize with current user data if available
    const [displayName, setDisplayName] = useState(user?.display_name || "")
    const [avatar, setAvatar] = useState(user?.avatar || "avatar-1")
    const [open, setOpen] = useState(false)

    const { toast } = useToast()

    // Update state when user object changes or dialog opens
    useEffect(() => {
        if (open && user) {
            setDisplayName(user.display_name || "")
            setAvatar(user.avatar || "avatar-1")
            // We could also sync theme here if we wanted to enforce saved theme
            if (user.theme_preference && user.theme_preference !== theme) {
                setTheme(user.theme_preference as any)
            }
        }
    }, [open, user, setTheme]) // Don't include theme in dependency to avoid loops

    const handleSave = async () => {
        try {
            const updatedUser = await api.updateProfile({
                display_name: displayName,
                avatar,
                theme_preference: theme
            })
            updateUser(updatedUser)
            toast({
                title: "Success",
                description: "Profile updated successfully!",
            })
            setOpen(false)
        } catch (error) {
            console.error('Profile update failed:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Profile Settings" className="relative">
                    <Settings className="h-5 w-5" />
                    {/* Add a notification dot if profile is incomplete (optional logic for later) */}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Customize your game appearance and profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="col-span-3"
                            placeholder="Enter display name"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Theme</Label>
                        <div className="col-span-3">
                            <RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)} className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="neon-green" id="neon-green" />
                                    <Label htmlFor="neon-green">Neon Green</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="cyber-punk" id="cyber-punk" />
                                    <Label htmlFor="cyber-punk">Cyber Punk</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="retro-wave" id="retro-wave" />
                                    <Label htmlFor="retro-wave">Retro Wave</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="midnight-blue" id="midnight-blue" />
                                    <Label htmlFor="midnight-blue">Midnight Blue</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sunset-orange" id="sunset-orange" />
                                    <Label htmlFor="sunset-orange">Sunset Orange</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Avatar</Label>
                        <div className="col-span-3 space-y-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-16 w-16 rounded-full flex items-center justify-center border-2 border-primary shadow-lg transition-all"
                                    style={{ backgroundColor: avatar.split('|')[0] || '#3b82f6' }}
                                >
                                    {(() => {
                                        const iconName = avatar.split('|')[1] || 'user';
                                        const Icon = iconName === 'ghost' ? Ghost :
                                            iconName === 'skull' ? Skull :
                                                iconName === 'smile' ? Smile : User;
                                        return <Icon className="h-8 w-8 text-white" />;
                                    })()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Customize your avatar
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Color</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`h-6 w-6 rounded-full border border-border transition-transform hover:scale-110 ${avatar.startsWith(color) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => {
                                                const currentIcon = avatar.split('|')[1] || 'user';
                                                setAvatar(`${color}|${currentIcon}`);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Icon</Label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'user', Icon: User },
                                        { id: 'ghost', Icon: Ghost },
                                        { id: 'skull', Icon: Skull },
                                        { id: 'smile', Icon: Smile },
                                    ].map(({ id, Icon }) => (
                                        <Button
                                            key={id}
                                            variant={avatar.endsWith(`|${id}`) || (!avatar.includes('|') && id === 'user') ? "default" : "outline"}
                                            size="icon"
                                            onClick={() => {
                                                const currentColor = avatar.split('|')[0] || '#3b82f6';
                                                setAvatar(`${currentColor}|${id}`);
                                            }}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
