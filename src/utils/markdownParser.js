import React from 'react';

/**
 * Parses markdown inline elements (bold, italic, code, wiki-links, checkboxes) into React elements.
 * @param {string} text - The line text to parse.
 * @param {Function} onWikiLinkClick - Callback when a wiki-link is clicked.
 * @returns {React.ReactNode[]} Array of parsed React elements or strings.
 */
export function parseInlineMarkdown(text, onWikiLinkClick) {
  if (!text) return '';

  // Regexp rules
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;
  const codeRegex = /`(.*?)`/g;
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;

  let parts = [text];

  // 1. Parse Wiki-links [[Target|Label]] or [[Target]]
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const subParts = [];
    let lastIndex = 0;
    let match;

    // Reset regex index just in case
    wikiLinkRegex.lastIndex = 0;

    while ((match = wikiLinkRegex.exec(part)) !== null) {
      const content = match[1];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        subParts.push(part.substring(lastIndex, matchIndex));
      }

      // Handle Obsidian wiki-link format: [[Target|Label]]
      let target = content;
      let label = content;
      if (content.includes('|')) {
        const split = content.split('|');
        target = split[0].trim();
        label = split[1].trim();
      }

      subParts.push(
        <span
          key={`wiki-${matchIndex}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onWikiLinkClick) onWikiLinkClick(target);
          }}
          className="wiki-link"
          title={`Ir para nota: ${target}`}
        >
          📄 {label}
        </span>
      );

      lastIndex = wikiLinkRegex.lastIndex;
    }

    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }

    return subParts;
  });

  // 2. Parse Bold **text**
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const subParts = [];
    let lastIndex = 0;
    let match;
    boldRegex.lastIndex = 0;

    while ((match = boldRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        subParts.push(part.substring(lastIndex, match.index));
      }
      subParts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }
    return subParts;
  });

  // 3. Parse Italic *text*
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const subParts = [];
    let lastIndex = 0;
    let match;
    italicRegex.lastIndex = 0;

    while ((match = italicRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        subParts.push(part.substring(lastIndex, match.index));
      }
      subParts.push(<em key={`italic-${match.index}`}>{match[1]}</em>);
      lastIndex = italicRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }
    return subParts;
  });

  // 4. Parse Code `text`
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const subParts = [];
    let lastIndex = 0;
    let match;
    codeRegex.lastIndex = 0;

    while ((match = codeRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        subParts.push(part.substring(lastIndex, match.index));
      }
      subParts.push(<code key={`code-${match.index}`}>{match[1]}</code>);
      lastIndex = codeRegex.lastIndex;
    }
    if (lastIndex < part.length) {
      subParts.push(part.substring(lastIndex));
    }
    return subParts;
  });

  return parts;
}

/**
 * Renders full markdown text (block elements and inline elements) to React.
 * @param {string} text - The Markdown text
 * @param {Function} onWikiLinkClick - Triggered when a wiki-link is clicked
 * @param {Function} onCheckboxToggle - Triggered when a checkbox state is clicked
 * @returns {React.ReactNode} React tree
 */
export function renderMarkdown(text, onWikiLinkClick, onCheckboxToggle) {
  if (!text) return <p className="italic opacity-40">Sem conteúdo...</p>;

  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(<ul key={`list-${key}`}>{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      // Check if second row is divider
      let header = null;
      let bodyRows = [];
      let startIndex = 0;

      if (tableRows.length > 1 && tableRows[1].every(cell => cell.trim().startsWith('-'))) {
        header = tableRows[0];
        startIndex = 2;
      }

      for (let i = startIndex; i < tableRows.length; i++) {
        if (i !== 1 || startIndex === 0) {
          bodyRows.push(tableRows[i]);
        }
      }

      elements.push(
        <table key={`table-${key}`}>
          {header && (
            <thead>
              <tr>
                {header.map((h, idx) => (
                  <th key={idx}>{parseInlineMarkdown(h, onWikiLinkClick)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{parseInlineMarkdown(cell, onWikiLinkClick)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const flushBlockquote = (key) => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`quote-${key}`}>
          {blockquoteLines.map((line, idx) => (
            <p key={idx}>{parseInlineMarkdown(line, onWikiLinkClick)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushCodeBlock = (key) => {
    if (codeBlockLines.length > 0) {
      elements.push(
        <pre key={`codeblock-${key}`}>
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Block ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i);
      } else {
        // Flush others
        flushList(i);
        flushTable(i);
        flushBlockquote(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Headers
    if (trimmed.startsWith('#')) {
      flushList(i);
      flushTable(i);
      flushBlockquote(i);

      const headerMatch = /^(\s*#+)\s*(.*)/.exec(line);
      if (headerMatch) {
        const level = headerMatch[1].trim().length;
        const headingText = headerMatch[2];
        const headingEl = parseInlineMarkdown(headingText, onWikiLinkClick);

        if (level === 1) elements.push(<h1 key={i}>{headingEl}</h1>);
        else if (level === 2) elements.push(<h2 key={i}>{headingEl}</h2>);
        else if (level === 3) elements.push(<h3 key={i}>{headingEl}</h3>);
        else if (level === 4) elements.push(<h4 key={i}>{headingEl}</h4>);
        else elements.push(<h5 key={i}>{headingEl}</h5>);
        continue;
      }
    }

    // 3. Blockquotes
    if (trimmed.startsWith('>')) {
      flushList(i);
      flushTable(i);
      inBlockquote = true;
      blockquoteLines.push(trimmed.substring(1).trim());
      continue;
    } else if (inBlockquote && trimmed !== '') {
      // Allow blockquote spanning multiple lines without '>' on each line
      blockquoteLines.push(trimmed);
      continue;
    } else if (inBlockquote) {
      flushBlockquote(i);
    }

    // 4. Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(i);
      flushBlockquote(i);
      inTable = true;
      // Split cell contents, filtering out the first and last empty elements from outer pipes
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // 5. Lists (unordered) & Checkboxes
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushTable(i);
      flushBlockquote(i);
      inList = true;

      const content = trimmed.substring(2).trim();
      const checkboxMatch = /^\[([ xX])\]\s(.*)/.exec(content);

      if (checkboxMatch) {
        const isChecked = checkboxMatch[1].toLowerCase() === 'x';
        const checkboxLabel = checkboxMatch[2];
        
        listItems.push(
          <li key={i} className="list-none flex items-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                if (onCheckboxToggle) {
                  onCheckboxToggle(i, !isChecked);
                }
              }}
            />
            <span>{parseInlineMarkdown(checkboxLabel, onWikiLinkClick)}</span>
          </li>
        );
      } else {
        listItems.push(<li key={i}>{parseInlineMarkdown(content, onWikiLinkClick)}</li>);
      }
      continue;
    } else if (inList && trimmed !== '') {
      // Continue list item multi-line? No, for simplicity, flush list if not starting with -
      flushList(i);
    } else if (inList) {
      flushList(i);
    }

    // 6. Regular Paragraphs
    if (trimmed === '') {
      elements.push(<div key={i} className="h-2"></div>);
    } else {
      elements.push(
        <p key={i}>
          {parseInlineMarkdown(line, onWikiLinkClick)}
        </p>
      );
    }
  }

  // Flush remaining blocks
  flushList('end');
  flushTable('end');
  flushBlockquote('end');
  flushCodeBlock('end');

  return <div className="markdown-content">{elements}</div>;
}
