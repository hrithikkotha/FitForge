const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'client', 'src', 'components', 'body_map.svg');
const outPath = path.join(__dirname, '..', 'client', 'src', 'components', 'FrontBodySvg.tsx');

let svg = fs.readFileSync(svgPath, 'utf8');

// Convert HTML attributes to JSX
svg = svg.replace(/\bclass=/g, 'className=');
svg = svg.replace(/\bstroke-width=/g, 'strokeWidth=');
svg = svg.replace(/\bstroke-linecap=/g, 'strokeLinecap=');
svg = svg.replace(/\bstroke-linejoin=/g, 'strokeLinejoin=');
svg = svg.replace(/\bfill-opacity=/g, 'fillOpacity=');
svg = svg.replace(/\bstop-color=/g, 'stopColor=');
svg = svg.replace(/\bstop-opacity=/g, 'stopOpacity=');
svg = svg.replace(/\bdata-name=/g, 'data-name=');

// Convert inline style strings to JSX style objects
svg = svg.replace(/style="([^"]*)"/g, (match, styleStr) => {
    const props = styleStr.split(';').filter(Boolean).map(item => {
        const [key, value] = item.split(':').map(s => s.trim());
        const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return `${camelKey}: "${value}"`;
    }).join(', ');
    return `style={{ ${props} }}`;
});

// Inject {...props} into root <svg
svg = svg.replace('<svg ', '<svg {...props} ');

// Remove class/tailwind stuff from root svg that won't work in React
svg = svg.replace(/className="w-full[^"]*"/, '');

const output = `import { type SVGProps } from 'react';
export const FrontBodySvg = (props: SVGProps<SVGSVGElement>) => (
${svg}
);
`;

fs.writeFileSync(outPath, output, 'utf8');
console.log('FrontBodySvg.tsx created successfully at', outPath);
