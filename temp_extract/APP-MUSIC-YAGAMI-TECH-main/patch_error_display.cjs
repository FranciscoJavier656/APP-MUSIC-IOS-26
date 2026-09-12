const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "export default function App() {";
const replacement = `
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("RootError:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red', background: 'white', height: '100vh', wordWrap: 'break-word'}}>
        <h1>Fatal Error</h1>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return <RootErrorBoundary><AppContent /></RootErrorBoundary>;
}

function AppContent() {`;

if (!code.includes("RootErrorBoundary")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx with RootErrorBoundary!");
}
