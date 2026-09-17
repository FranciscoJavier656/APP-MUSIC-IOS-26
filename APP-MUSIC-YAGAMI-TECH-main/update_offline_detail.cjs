const fs = require('fs');

let code = fs.readFileSync('src/components/OfflineDetailView.tsx', 'utf8');

code = code.replace(
  "type: 'album' | 'artist';",
  "type: 'album' | 'artist';\n  onRemoveTrack?: (id: string) => void;"
);

code = code.replace(
  "export default function OfflineDetailView({ item, tracks, onBack, type }: OfflineDetailProps) {",
  "import { Trash2 } from 'lucide-react';\n\nexport default function OfflineDetailView({ item, tracks, onBack, type, onRemoveTrack }: OfflineDetailProps) {"
);

code = code.replace(
  `<p className="text-gray-500 text-[13px] font-medium truncate mt-0.5">{track.subtitle || 'Unknown'}</p>
                  </div>
                </div>`,
  `<p className="text-gray-500 text-[13px] font-medium truncate mt-0.5">{track.subtitle || 'Unknown'}</p>
                  </div>
                  {onRemoveTrack && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>`
);

fs.writeFileSync('src/components/OfflineDetailView.tsx', code);
