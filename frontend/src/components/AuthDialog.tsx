import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
    children?: React.ReactNode;
    onSuccess?: () => void;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
    feedback: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length === 0) {
        return {
            score: 0,
            label: '',
            color: '',
            feedback: [],
        };
    }

    // Minimum length check (required)
    if (password.length < 8) {
        return {
            score: 0,
            label: 'Too Short',
            color: 'bg-red-500',
            feedback: ['Use at least 8 characters'],
        };
    }

    // Length contribution
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    else if (password.length >= 8) feedback.push('Use 12+ characters for better security');

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters (!@#$%^&*)');

    // Determine label and color (score range: 0-5)
    let label = '';
    let color = '';

    if (score <= 1) {
        label = 'Very Weak';
        color = 'bg-red-500';
    } else if (score === 2) {
        label = 'Weak';
        color = 'bg-orange-500';
    } else if (score === 3) {
        label = 'Fair';
        color = 'bg-yellow-500';
    } else if (score === 4) {
        label = 'Good';
        color = 'bg-blue-500';
    } else {
        label = 'Strong';
        color = 'bg-green-500';
    }

    return {
        score: Math.min(score, 5),
        label,
        color,
        feedback: feedback.filter(f => f.length > 0),
    };
};

const passwordPolicies = [
    'At least 8 characters long',
    'Contains uppercase and lowercase letters',
    'Contains at least one number',
    'Contains at least one special character (!@#$%^&*)',
];

export const AuthDialog: React.FC<AuthDialogProps> = ({ children, onSuccess, isOpen, onOpenChange }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);
    const { login, register } = useAuth();
    const { toast } = useToast();

    // Use controlled or uncontrolled state
    const isControlled = typeof isOpen !== 'undefined';
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;

    // Safety check for controlled component usage
    if (isControlled && !onOpenChange) {
        console.warn('AuthDialog: isOpen provided but onOpenChange is missing.');
    }

    const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
                toast({
                    title: 'Success',
                    description: 'Logged in successfully!',
                });
            } else {
                // Validate password strength for registration
                if (passwordStrength.score < 2) {
                    toast({
                        title: 'Weak Password',
                        description: 'Please choose a stronger password. See suggestions below.',
                        variant: 'destructive',
                    });
                    setIsLoading(false);
                    return;
                }

                await register(username, password);
                toast({
                    title: 'Success',
                    description: 'Account created and logged in!',
                });
            }
            setOpen?.(false);
            setUsername('');
            setPassword('');
            onSuccess?.();
        } catch (error: unknown) {
            let errorMessage = 'Authentication failed';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                // Try to extract error message from API response
                const apiError = error as { message?: string; detail?: string };
                errorMessage = apiError.message || apiError.detail || errorMessage;
            }

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeSwitch = () => {
        setIsLogin(!isLogin);
        setPassword(''); // Clear password when switching modes
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen?.(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isLogin ? 'Login' : 'Register'}</DialogTitle>
                    <DialogDescription>
                        {isLogin
                            ? 'Enter your credentials to login'
                            : 'Create a new account to save your scores'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            minLength={3}
                            autoComplete="username"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            minLength={8}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />

                        {!isLogin && password.length > 0 && (
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Password Strength:</span>
                                    <span className={`font-semibold ${passwordStrength.score <= 1 ? 'text-red-500' :
                                        passwordStrength.score === 2 ? 'text-orange-500' :
                                            passwordStrength.score === 3 ? 'text-yellow-500' :
                                                passwordStrength.score === 4 ? 'text-blue-500' :
                                                    'text-green-500'
                                        }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className={`h-full transition-all ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    />
                                </div>

                                {passwordStrength.feedback.length > 0 && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p className="font-semibold">Suggestions to strengthen your password:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {passwordStrength.feedback.slice(0, 3).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {passwordStrength.score >= 3 && (
                                    <div className="text-xs text-green-600 font-semibold">
                                        ✓ Your password looks good!
                                    </div>
                                )}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2">
                                <p className="text-sm font-semibold text-foreground">Password Requirements:</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    {passwordPolicies.map((policy, idx) => (
                                        <li key={idx}>{policy}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-muted-foreground italic">
                                    Example: <span className="font-mono">MyP@ssw0rd!</span>
                                </p>
                            </div>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
                    </Button>
                    <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={handleModeSwitch}
                        disabled={isLoading}
                    >
                        {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
