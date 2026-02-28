"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const {
    mode,
    user,
    profile,
    signInWithGoogle,
    signOut,
    deleteAccount,
  } = useAuth();

  const [authBusy, setAuthBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
    return "Failed to delete account";
  };

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setDeleteDialogOpen(false);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and sign-in preferences.
        </p>
      </div>

      <div className="space-y-4">
        <section className="border border-border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium text-foreground">Account</h3>
          {mode === "authenticated" && (
            <p className="text-xs text-muted-foreground">
              Signed in as {profile?.email ?? user?.email ?? "Unknown user"}
            </p>
          )}
          <div className="mt-3">
            {mode === "authenticated" ? (
              <button
                type="button"
                disabled={authBusy}
                onClick={async () => {
                  setAuthBusy(true);
                  try {
                    await signOut();
                  } finally {
                    setAuthBusy(false);
                  }
                }}
                className="inline-flex h-8 items-center gap-1.5 border border-border bg-background px-3 text-xs text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
              >
                {authBusy ? <Loader2 className="size-3 animate-spin" /> : null}
                Sign out
              </button>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={async () => {
                  setAuthBusy(true);
                  try {
                    await signInWithGoogle();
                  } finally {
                    setAuthBusy(false);
                  }
                }}
                className="inline-flex h-8 items-center gap-1.5 border border-border bg-background px-3 text-xs text-foreground transition-colors hover:bg-elevated disabled:opacity-50"
              >
                {authBusy ? <Loader2 className="size-3 animate-spin" /> : null}
                Sign in with Google
              </button>
            )}
          </div>

          {mode === "authenticated" && (
            <div className="mt-4 border-t border-border pt-4">
              <h4 className="mb-1 text-sm font-medium text-foreground">Delete account</h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Permanently removes your account and all associated data.
              </p>
              {deleteError ? (
                <p className="mb-2 text-xs text-destructive">{deleteError}</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteDialogOpen(true);
                }}
                className="inline-flex h-8 items-center gap-1.5 bg-destructive/10 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                Delete account
              </button>
            </div>
          )}
        </section>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, watchlists, and research history.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p className="text-xs text-destructive">{deleteError}</p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={deleteBusy}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteBusy}
              onClick={handleDeleteAccount}
            >
              {deleteBusy ? <Loader2 className="size-3 animate-spin" /> : null}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
