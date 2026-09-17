import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ZoomableImage } from "@/components/ui/ZoomableImage";

it("사진이 있으면 확대 버튼으로 렌더링한다", () => {
  const html = renderToStaticMarkup(<ZoomableImage src="/camera.png" alt="반납 시 후면" />);

  expect(html).toContain("반납 시 후면 확대");
  expect(html).toContain("cursor-zoom-in");
  expect(html).toContain("확대");
});

it("사진이 없으면 확대 버튼 없이 빈 사진 영역을 렌더링한다", () => {
  const html = renderToStaticMarkup(<ZoomableImage src={null} alt="수령 시 정면" />);

  expect(html).not.toContain("수령 시 정면 확대");
  expect(html).toContain("placeholder-pattern");
});
