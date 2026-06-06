// Minimal inline SVG icons (stroke-based, inherit currentColor).
const S = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const IconDashboard = (p) => (<svg {...S} {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>);
export const IconBox = (p) => (<svg {...S} {...p}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>);
export const IconUsers = (p) => (<svg {...S} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
export const IconCart = (p) => (<svg {...S} {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.58l1.65-7.42H5.12"/></svg>);
export const IconPlus = (p) => (<svg {...S} {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
export const IconEdit = (p) => (<svg {...S} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>);
export const IconTrash = (p) => (<svg {...S} {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
export const IconX = (p) => (<svg {...S} {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
export const IconEye = (p) => (<svg {...S} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>);
export const IconAlert = (p) => (<svg {...S} {...p}><path d="m21.7 18-9-16a1.5 1.5 0 0 0-2.6 0l-9 16A1.5 1.5 0 0 0 2.3 20h19.4a1.5 1.5 0 0 0 1.3-2Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>);
