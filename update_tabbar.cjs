const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

// Replace the fallbackTabBar VStack to ensure text visibility
content = content.replace(/VStack\(spacing: 4\) {[\s\S]*?Text\(tab\.2\)[\s\S]*?}/, 
`VStack(spacing: 3) {
                        Image(systemName: tab.1)
                            .font(.system(size: isActive ? 20 : 18, weight: isActive ? .bold : .semibold))
                            .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                        Text(tab.2)
                            .font(.system(size: 10, weight: isActive ? .bold : .medium))
                            .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }`);

// Also fix the `.foregroundColor` that was on the VStack just in case
content = content.replace(/\.foregroundColor\(isActive \? \.white : \.gray\)/g, '');

fs.writeFileSync(path, content);
console.log("Updated LiquidTabBarPlugin.swift");
