/**
 * 路由懒加载 Suspense fallback.
 */
import { Spin } from "antd";

export default function PageLoading() {
  return (
    <div style={styles.wrap}>
      <Spin size="large" />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: 240,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
