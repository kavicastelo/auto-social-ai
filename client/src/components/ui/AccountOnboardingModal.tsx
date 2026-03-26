import { useState, useEffect } from 'react';
import { XIcon, ShieldCheckIcon, LinkIcon, ChevronRightIcon, CheckCircle2Icon } from 'lucide-react';
import { Button } from './Button';
import { PlatformIcon } from './PlatformIcon';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface AccountOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockPlatforms = [
  { id: 'twitter', name: 'Twitter', description: 'Reach a broad audience with short updates.', recommended: true },
  { id: 'linkedin', name: 'LinkedIn', description: 'Grow your professional network.', recommended: true },
  { id: 'instagram', name: 'Instagram', description: 'Share visual stories and moments.' },
  { id: 'facebook', name: 'Facebook', description: 'Connect with a global community.' },
];

export function AccountOnboardingModal({ isOpen, onClose }: AccountOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { activeWorkspace } = useAuth();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedPlatform(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);

  const handleConnect = () => {
    // Redirect to Fastify OAuth flow
    // Pass workspace ID in query so it can be handled by the server state
    if (!selectedPlatform) return;
    window.location.href = `http://localhost:3000/api/auth/login/${selectedPlatform}?workspaceId=${activeWorkspace?.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
          <div className="flex gap-1.5 items-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <LinkIcon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm">Connect Social Account</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted text-muted-foreground transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step 1: Introduction */}
        {step === 1 && (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
              <ShieldCheckIcon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Expand Your Reach</h2>
              <p className="text-muted-foreground">
                CreatorGene needs permission to publish on your behalf. We use secure OAuth—meaning we never see or store your passwords.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3 border border-border">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span><strong>Direct Publishing:</strong> Post immediately or schedule for later.</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span><strong>Analytics Access:</strong> Track engagement and follower growth automatically.</span>
              </div>
            </div>
            <Button className="w-full gap-2 mt-4 py-6 text-md font-semibold" onClick={handleNext}>
              Let's get started <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Select Platform */}
        {step === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1">Choose a Platform</h2>
            <p className="text-sm text-muted-foreground mb-6">Which network would you like to connect to <strong>{activeWorkspace?.name}</strong> first?</p>

            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {mockPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={cn(
                    "flex text-left items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                    selectedPlatform === platform.id
                      ? "border-violet-500 bg-violet-500/5 shadow-sm ring-1 ring-violet-500"
                      : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    selectedPlatform === platform.id ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <PlatformIcon platform={platform.name} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{platform.name}</h4>
                      {platform.recommended && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">Recommended</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <div className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center",
                    selectedPlatform === platform.id ? "border-violet-500 bg-violet-500" : "border-muted-foreground/30"
                  )}>
                    {selectedPlatform === platform.id && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="flex-1 shadow-sm"
                disabled={!selectedPlatform}
                onClick={handleNext}
              >
                Continue Configuration
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Connect & Authenticate */}
        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping opacity-50" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg z-10">
                {selectedPlatform && (
                  <PlatformIcon platform={selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} className="h-8 w-8" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Ready to authenticate</h2>
              <p className="text-sm text-muted-foreground">
                You will be redirected securely to the provider.
                Log in and authorize our application to proceed.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400 text-left flex gap-3">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <p>Make sure you are logging into the correct profile if you manage multiple accounts.</p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Change Platform</Button>
              <Button onClick={handleConnect} className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90">
                Connect Now <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
