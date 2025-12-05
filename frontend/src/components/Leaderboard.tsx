import { useQuery } from '@tanstack/react-query';
import { api, Score } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';

export const Leaderboard: React.FC = () => {
    const { data: scores, isLoading, error } = useQuery<Score[]>({
        queryKey: ['leaderboard'],
        queryFn: () => api.getLeaderboard(10),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    if (isLoading) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">🏆 Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">🏆 Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-destructive">Failed to load leaderboard</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <CardTitle className="text-3xl font-bold text-center">🏆 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {scores && scores.length > 0 ? (
                    <div className="divide-y">
                        {scores.map((score, index) => (
                            <div
                                key={score.id}
                                className={`flex items-center justify-between p-4 ${index === 0
                                    ? 'bg-yellow-50'
                                    : index === 1
                                        ? 'bg-gray-50'
                                        : index === 2
                                            ? 'bg-orange-50'
                                            : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-gray-400 w-8">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                    </span>
                                    <UserAvatar avatarString={score.avatar} size="sm" />
                                    <div>
                                        <p className="font-semibold text-lg">{score.username}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(score.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-primary">{score.score}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No scores yet. Be the first to play!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
