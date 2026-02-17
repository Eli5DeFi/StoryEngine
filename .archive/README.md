# Archive Directory

This directory contains historical development documents that have been moved out of the main repository to keep the GitHub cleaner.

## Innovation Cycles

Innovation cycle documents are now included in **Pull Requests** rather than the main repository.

**Format:**
- Each PR includes the innovation proposal as part of the PR description
- Technical specifications in separate markdown files within the PR
- Discussions happen in PR comments

**Why?**
- Keeps the main repo focused on code and user documentation
- Innovation context stays with the implementation
- Easier to track which innovations were actually implemented
- Cleaner GitHub repository structure

## What's Here

```
.archive/
├── innovation-cycles/     # Historical innovation proposals (Cycles 43-45)
└── README.md             # This file
```

## Where Things Go Now

| Document Type | Location |
|---------------|----------|
| Code | Main repository |
| User docs | `/docs/` or root README |
| Technical specs | Pull Request descriptions |
| Innovation proposals | Pull Request descriptions |
| Test results | Pull Request comments |
| Build artifacts | `.gitignore`d (not committed) |

---

**Note:** These files are preserved for historical reference but are no longer actively maintained.
