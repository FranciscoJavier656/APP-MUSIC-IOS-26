const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

const replacement = `
              </div>

              {categoryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                   <Loader2 className="w-8 h-8 animate-spin mb-4" />
                   <p className="text-sm font-semibold">Cargando {activeCategory}...</p>
                </div>
              ) : (
                <>
                  {/* Novedades / Álbumes de la semana */}
`;

code = code.replace(
  /              <\/div>\s*\{\/\* Novedades \/ Álbumes de la semana \*\/\}/m,
  replacement
);

code = code.replace(
  /                  <\/div>\s*\)\)}\s*<\/div>\s*<\/div>\s*\) : \(\s*<div className="h-full">/m,
  `                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full">`
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
