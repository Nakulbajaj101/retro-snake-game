import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = (() => {
    return {
        fillStyle: '',
        fillRect: () => { },
        strokeStyle: '',
        lineWidth: 0,
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        stroke: () => { },
        arc: () => { },
        fill: () => { },
        strokeRect: () => { },
    } as any;
}) as any;
