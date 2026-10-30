import { useMemo } from "react";

// Code 128B symbol patterns. Each digit is a bar/space module width.
const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "211412", "211214", "211232", "233111",
];

function encodeCode128B(value) {
    const text = String(value || "").replace(/[^\x20-\x7e]/g, "?");
    const symbols = [104, ...Array.from(text, (character) => character.charCodeAt(0) - 32)];
    const checksum = symbols.reduce((total, symbol, index) => total + (index === 0 ? symbol : symbol * index), 0) % 103;
    return [...symbols, checksum, 106];
}

export default function Code128Barcode({ value, label = value }) {
    const bars = useMemo(() => {
        const symbols = encodeCode128B(value);
        const moduleWidth = 2;
        const quietZone = 12;
        const barHeight = 52;
        const rects = [];
        let x = quietZone;

        symbols.forEach((symbol) => {
            const pattern = CODE128_PATTERNS[symbol];
            let isBar = true;
            for (const width of pattern) {
                const scaledWidth = Number(width) * moduleWidth;
                if (isBar) rects.push({ x, width: scaledWidth });
                x += scaledWidth;
                isBar = !isBar;
            }
        });

        return { rects, width: x + quietZone, barHeight };
    }, [value]);

    return (
        <svg
            className="code128-barcode"
            role="img"
            aria-label={`Barcode ${label}`}
            viewBox={`0 0 ${bars.width} 78`}
            preserveAspectRatio="xMidYMid meet"
        >
            <rect width={bars.width} height="78" fill="#ffffff" />
            {bars.rects.map((bar, index) => (
                <rect key={index} x={bar.x} y="4" width={bar.width} height={bars.barHeight} fill="#17221d" />
            ))}
            <text x={bars.width / 2} y="72" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#17221d">
                {label}
            </text>
        </svg>
    );
}
