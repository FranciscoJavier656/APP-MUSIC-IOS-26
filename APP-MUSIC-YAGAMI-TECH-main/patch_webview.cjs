const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

const target = `                    // Adjust webview padding so content is not blocked
                    if let webView = self.bridge?.webView {
                        webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 120, right: 0)
                    }`;

const replacement = `                    // Ensure Webview lets Swift show through
                    if let webView = self.bridge?.webView {
                        webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 120, right: 0)
                        webView.isOpaque = false
                        webView.backgroundColor = UIColor.clear
                        webView.scrollView.backgroundColor = UIColor.clear
                    }
                    viewController.view.backgroundColor = UIColor.clear`;

code = code.replace(target, replacement);
fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched WebView opacity!");
