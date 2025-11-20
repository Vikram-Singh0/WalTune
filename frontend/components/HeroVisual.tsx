export function HeroVisual() {
    return (
        <div className="relative w-full aspect-[16/9] bg-[#4ade80] rounded-3xl p-8 overflow-hidden shadow-2xl">
            {/* Abstract Dashboard UI */}
            <div className="absolute top-12 left-12 right-12 bottom-0 bg-[#0a0a0a]/10 backdrop-blur-sm rounded-t-2xl border border-white/20 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#4ade80]"
                            />
                        ))}
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs border-2 border-[#4ade80]">
                            +8
                        </div>
                    </div>
                </div>

                {/* Flow Chart / Process Visual */}
                <div className="relative h-full">
                    {/* Central Node */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500" />
                        <div>
                            <div className="text-sm font-bold">Arthur King</div>
                            <div className="text-xs text-gray-400">Verified Artist</div>
                        </div>
                    </div>

                    {/* Connected Nodes */}
                    <div className="absolute bottom-1/4 left-10 bg-black/80 text-white p-4 rounded-xl shadow-lg border border-white/10 w-48">
                        <div className="text-xs text-gray-400 mb-1">Project Created</div>
                        <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full w-3/4 bg-green-500" />
                        </div>
                    </div>

                    <div className="absolute bottom-1/4 right-10 bg-black/80 text-white p-4 rounded-xl shadow-lg border border-white/10 w-48">
                        <div className="text-xs text-gray-400 mb-1">Process Started</div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs">
                                Active
                            </span>
                            <span className="text-xs text-gray-500">Just now</span>
                        </div>
                    </div>

                    {/* Connecting Lines (SVG) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                        <path
                            d="M200 300 C 300 300, 300 150, 400 150"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />
                        <path
                            d="M600 300 C 500 300, 500 150, 400 150"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                        />
                    </svg>
                </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 right-20 animate-bounce duration-[3000ms]">
                <div className="text-4xl">✳️</div>
            </div>
        </div>
    );
}
