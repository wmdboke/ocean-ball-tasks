# How to Use Project Requirements with Claude

## Method 1: Using .claude Directory (Recommended)

The requirements file is already placed in `.claude/project-requirements.md`. Claude Code automatically reads files in the `.claude` directory as project context.

**No additional action needed!** Claude will automatically reference these requirements when working on your project.

## Method 2: Manual Reference in Prompts

When starting a new conversation with Claude, you can explicitly reference the requirements:

```
Please follow the requirements in .claude/project-requirements.md for this project.

[Your actual request here]
```

## Method 3: Add to Project Instructions

If using Claude.ai or other Claude interfaces:

1. Copy the content from `.claude/project-requirements.md`
2. Add it to your project's custom instructions or system prompt
3. Claude will follow these requirements for all conversations

## Updating Requirements

To modify requirements:

1. Edit `.claude/project-requirements.md`
2. Add or remove requirements as needed
3. Claude will automatically use the updated requirements

## Example Usage

### Good Prompt:
```
Add a new feature to export tasks to CSV format.
```

Claude will automatically:
- Use English for all text
- Write minimal code
- Use TypeScript with proper types
- Follow the existing code style

### When to Explicitly Mention Requirements:
```
Add a new feature with Chinese UI text.
Note: Override the English-only requirement for this specific feature.
```

## Tips

- The `.claude` directory is automatically read by Claude Code
- Keep requirements updated as your project evolves
- Be specific about exceptions when you need to override a requirement
- Requirements help maintain consistency across development sessions
