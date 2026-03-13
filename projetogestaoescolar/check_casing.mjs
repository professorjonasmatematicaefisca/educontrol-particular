import fs from 'fs';
import path from 'path';

function checkImports(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') checkImports(fullPath);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;

            let match;
            while ((match = importRegex.exec(content)) !== null) {
                let importPath = match[1];
                if (importPath.startsWith('.')) {
                    const resolvedDir = path.dirname(fullPath);
                    const targetPathBase = path.resolve(resolvedDir, importPath);
                    const targetDir = path.dirname(targetPathBase);

                    if (!fs.existsSync(targetDir)) continue;

                    const targetFiles = fs.readdirSync(targetDir);
                    const expectedName = path.basename(targetPathBase);

                    const matchingFile = targetFiles.find(name => {
                        const base = name.replace(/\.(ts|tsx|js|jsx|css)$/, '');
                        return base.toLowerCase() === expectedName.toLowerCase() || name.toLowerCase() === expectedName.toLowerCase();
                    });

                    if (matchingFile) {
                        const base = matchingFile.replace(/\.(ts|tsx|js|jsx|css)$/, '');
                        if (base !== expectedName && matchingFile !== expectedName) {
                            console.log(`[!] CASE MISMATCH in ${fullPath}: imports '${importPath}' but file is '${matchingFile}'`);
                        }
                    }
                }
            }
        }
    }
}

console.log("Checking for import casing mismatches...");
checkImports('./');
console.log("Done.");
