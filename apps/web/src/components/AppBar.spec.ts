import { describe, afterEach, it, expect, vi } from "vitest";
import { render, cleanup } from "@testing-library/vue";
import AppBar from "~/components/AppBar.vue";

describe("AppBar", () => {
  afterEach(() => {
    cleanup();
  });
  it("should render the title prop", async () => {
    const title = "Test Title";
    const { getByRole } = render(AppBar, {
      props: {
        title,
      },
    });
    expect(getByRole("heading").textContent).toEqual(title);
  });

  it("should render the back button when showBackButton is true", async () => {
    const { getByRole } = render(AppBar, {
      props: {
        showBackButton: true,
      },
    });

    expect(getByRole("button")).toBeDefined();
  });

  it("should call onClickBack when the back button is clicked", async () => {
    const onClickBack = vi.fn();
    const { getByRole } = render(AppBar, {
      props: {
        showBackButton: true,
        onClickBack,
      },
    });

    await getByRole("button").click();
    expect(onClickBack).toHaveBeenCalled();
  });

  it("should render v-slot right", async () => {
    const { getByText } = render(AppBar, {
      slots: {
        right: `<button>Right button</button>`,
      },
    });

    expect(getByText("Right button")).toBeDefined();
  });

  it("should change style if transparent is set", async () => {
    const { getByRole } = render(AppBar, {
      props: {
        transparent: true,
      },
    });

    expect(getByRole("banner").className).toContain("bg-transparent");
  });
});
