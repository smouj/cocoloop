# Security policy

## Supported versions

| Version | Status |
|---|---|
| 0.2.x | Supported (alpha) |
| 0.1.x | Best effort |

CL Studio is an alpha local application. It has **not** undergone an independent security audit.

## Reporting a vulnerability

Please **do not open a public issue** for a vulnerability. Use GitHub's private advisory flow:

1. Go to <https://github.com/smouj/cocoloop/security/advisories/new>.
2. Describe the issue, affected version, reproduction steps and impact.
3. Include the operating system, Python version and browser.

You can expect an initial acknowledgement within 7 days. Please allow reasonable time for a fix before public disclosure.

## Threat model

**Assets**
- The user's music projects and imported samples.
- The local agent token at `~/.cocoloop/agent-token`.
- The user's machine, which is reachable through the agent's own tooling — not through CL Studio.

**Trust boundaries**
- The browser UI is untrusted input to the local server.
- Agents are untrusted input to the UI.
- The server is the only component that listens on a socket.

**In scope**
- Authentication and origin bypasses in the local HTTP bridge.
- Actions that escape the documented musical schema.
- Path traversal, XSS, CSRF, header injection or token leakage.
- Denial of service that survives a restart or corrupts project files.

**Out of scope**
- Anything that requires exposing the port to the public Internet; that deployment is unsupported.
- Vulnerabilities in the user's browser, Python installation or agent platform.
- Social engineering and physical access.

## Default controls

- Loopback-only bind and `Host` validation.
- Bearer token with constant-time comparison, stored with mode `0600` where supported.
- Agent mutation requires an in-UI consent toggle that resets on reload.
- Bounded, allowlisted action schema; unknown fields are ignored or rejected.
- Request size limits (2 MB) and command queue limits (250).
- Content-Security-Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`.
- Directory listing disabled.

## Hardening recommendations

- Run the studio under a dedicated user account if you import untrusted project files.
- Rotate the token by deleting `~/.cocoloop/agent-token` while the server is stopped.
- Never expose port 38475 through a tunnel or reverse proxy.
- Review agent actions in the Activity Log and use undo for anything unexpected.
