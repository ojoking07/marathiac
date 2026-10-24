<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Test timers and lockdown listeners must call the latest submission callback through a ref; long-lived listeners otherwise submit the initial empty answers.
- Keep failed test answers in the finished-test screen with an explicit retry, and read back attempts after a failed response before retrying a possible committed write.
- Derive test ownership from a server-validated Auth user; scoring remains server-only and student writes to scored attempts remain denied.
