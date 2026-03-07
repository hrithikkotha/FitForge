import { useState, type MouseEvent } from 'react';
import { BackBodySvg } from './BackBodySvg';
// TODO: Replace with new FrontBodySvg when user provides it
import { FrontBodySvg } from './FrontBodySvg';

interface BodySVGProps {
    view: 'front' | 'back';
    muscleFrequency: Record<string, number>;
    selectedMuscle: string;
    onSelectMuscle: (muscle: string) => void;
}

// Map SVG group IDs → our muscle key names
const SVG_ID_TO_MUSCLE: Record<string, string> = {
    'traps': 'traps',
    'traps-middle': 'traps',
    'rear-shoulders': 'shoulders',
    'front-shoulders': 'shoulders',
    'lats': 'lats',
    'lowerback': 'lower_back',
    'triceps': 'triceps',
    'biceps': 'biceps',
    'forearms': 'forearms',
    'glutes': 'glutes',
    'hamstrings': 'hamstrings',
    'quads': 'quads',
    'calves': 'calves',
    'chest': 'chest',
    'abdominals': 'abs',
    'obliques': 'obliques',
};

const getHeatColor = (count: number): string => {
    if (count === 0) return '#3a3f5c';
    if (count <= 2) return '#90caf9';
    if (count <= 4) return '#66bb6a';
    if (count <= 7) return '#ffb74d';
    return '#ef5350';
};

const BodySVG = ({ view, muscleFrequency, selectedMuscle, onSelectMuscle }: BodySVGProps) => {
    const [hovered, setHovered] = useState('');

    const muscleLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Generate dynamic styles for the SVG based on heatmap and hover states
    const generateStyles = () => {
        let styles = `
            .svg-muscle-layer g[id="body"] path,
            .svg-muscle-layer g[id="body"] line {
                stroke: #6b7394 !important;
                stroke-width: 2px !important;
                fill: none !important;
            }
            .svg-muscle-layer g[id]:not([id="body"]) path {
                fill: #8892a8; /* Default base color */
                cursor: pointer;
                transition: all 0.25s ease;
            }
            .svg-muscle-layer g[id]:not([id="body"]):hover path {
                fill: rgb(201, 99, 99) !important;
                filter: brightness(1.2);
            }
        `;

        Object.entries(SVG_ID_TO_MUSCLE).forEach(([svgId, muscleKey]) => {
            const freq = muscleFrequency[muscleKey] || 0;
            const isSelected = selectedMuscle === muscleKey;

            // Only add CSS override if there's frequency data or it's selected
            if (freq > 0 || isSelected) {
                styles += `
                    .svg-muscle-layer g[id="${svgId}"] path {
                        ${freq > 0 && !isSelected ? `fill: ${getHeatColor(freq)} !important;` : ''}
                        ${isSelected ? `fill: rgb(201, 99, 99) !important; stroke: #fca311 !important; stroke-width: 3px !important;` : ''}
                    }
                `;
            }
        });

        return styles;
    };

    // Click handler via delegation
    const handleClick = (e: MouseEvent) => {
        let target = e.target as SVGElement | null;
        while (target && target.tagName !== 'svg') {
            const gEl = target.closest('g[id]');
            if (gEl) {
                const id = gEl.getAttribute('id') || '';
                const muscle = SVG_ID_TO_MUSCLE[id];
                if (muscle) {
                    onSelectMuscle(muscle);
                    return;
                }
            }
            target = target.parentElement as SVGElement | null;
        }
    };

    const handleMouseOver = (e: MouseEvent) => {
        let target = e.target as SVGElement | null;
        while (target && target.tagName !== 'svg') {
            const gEl = target.closest('g[id]');
            if (gEl) {
                const id = gEl.getAttribute('id') || '';
                const muscle = SVG_ID_TO_MUSCLE[id];
                if (muscle) { setHovered(muscle); return; }
            }
            target = target.parentElement as SVGElement | null;
        }
    };

    const SvgComponent = view === 'back' ? BackBodySvg : FrontBodySvg;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
            <style dangerouslySetInnerHTML={{ __html: generateStyles() }} />
            <div
                onClick={handleClick}
                onMouseOver={handleMouseOver}
                onMouseLeave={() => setHovered('')}
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892a8' }}
            >
                <SvgComponent
                    className="svg-muscle-layer"
                    style={{ width: '100%', height: '100%', maxHeight: 550, display: 'block' }}
                />
            </div>
            {hovered && (
                <div style={{
                    position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                    background: '#14213d', padding: '5px 14px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, color: '#fff',
                    border: '1px solid rgba(252,163,17,0.3)', whiteSpace: 'nowrap', zIndex: 10,
                }}>
                    {muscleLabel(hovered)} · {muscleFrequency[hovered] || 0} sessions
                </div>
            )}
        </div>
    );
};

export default BodySVG;
