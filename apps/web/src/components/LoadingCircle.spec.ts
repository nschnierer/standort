import { describe, afterEach, it, expect, vi } from "vitest";
import { render, cleanup } from "@testing-library/vue";
import LoadingCircle from "~/components/LoadingCircle.vue";

describe("LoadingCircle", () => {
  afterEach(() => {
    cleanup();
  });
  it("should render a svg", async () => {
    const { baseElement } = render(LoadingCircle);

    // check if svg
    expect(baseElement.querySelector("svg")).toBeDefined();
  });

  it("should prop class", async () => {
    // Check if the class is applied

    const { baseElement } = render(LoadingCircle, {
      props: {
        class: "test-class",
      },
    });
    expect(baseElement.querySelector("svg")?.getAttribute("class")).toContain(
      "test-class"
    );
  });
});
