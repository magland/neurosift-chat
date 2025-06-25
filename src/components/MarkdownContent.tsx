import { useState, type FunctionComponent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs as highlightStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  type ChartType,
  type ChartOptions,
  LogarithmicScale,
  TimeScale,
  RadialLinearScale,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  RadarController,
  BubbleController,
  ScatterController,
  PolarAreaController,
  Filler,
  SubTitle,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  // Elements
  BarElement,
  LineElement,
  PointElement,
  ArcElement,

  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  RadialLinearScale,

  // Controllers
  BarController,
  LineController,
  PieController,
  DoughnutController,
  RadarController,
  BubbleController,
  ScatterController,
  PolarAreaController,

  // Plugins
  Title,
  Tooltip,
  Legend,
  Filler,
  SubTitle // optional
);

interface MarkdownContentProps {
  content: string;
  onSpecialLinkClicked?: (linkText: string) => void;
}

const MarkdownContent: FunctionComponent<MarkdownContentProps> = ({
  content,
  onSpecialLinkClicked,
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ children, ...props }) {
          if (props.href?.startsWith("?")) {
            const linkText = props.href;
            return (
              <a
                role="button"
                style={{ cursor: 'pointer', color: '#0000EE', textDecoration: 'underline' }}
                onClick={(e) => {
                  e.preventDefault();
                  if (onSpecialLinkClicked) {
                    onSpecialLinkClicked(linkText);
                  }
                }}
              >
                {children}
              </a>
            );
          }
          return (
            <a
              href={props.href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          );
        },
        code(props) {
          const { children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          const language = (className || "").replace("language-", "");

          // Handle `chart` blocks
          if (language === "chart") {
            try {
              const config = JSON.parse(code);
              const { type, data, options } = config;
              return (
                <div style={{ maxWidth: "600px", margin: "1em 0" }}>
                  <Chart type={type as ChartType} data={data} options={options as ChartOptions} />
                </div>
              );
            } catch (e) {
              return (
                <pre style={{ color: "red" }}>
                  Invalid chart configuration: {e instanceof Error ? e.message : String(e)}
                </pre>
              );
            }
          }

          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [copied, setCopied] = useState(false);

          const handleCopy = () => {
            navigator.clipboard.writeText(code);
            setCopied(true);
          };

          return match ? (
            <div style={{ position: "relative" }}>
              <SyntaxHighlighter
                PreTag="div"
                children={code}
                language={match[1]}
                style={highlightStyle}
              />
              <button
                onClick={handleCopy}
                style={{
                  color: "black",
                  position: "absolute",
                  right: "8px",
                  bottom: "24px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <code
              {...rest}
              className={className}
              // style={{ background: "#eee" }}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownContent;
