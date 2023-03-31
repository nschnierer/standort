import { describe, afterEach, it, expect, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/vue";
import QRCodeImage from "~/components/QRCodeImage.vue";
import QRCode from "qrcode";

describe("QRCodeImage", () => {
  afterEach(() => {
    cleanup();
  });
  it("should render a image", async () => {
    const { getByAltText } = render(QRCodeImage, { props: { data: "TEST" } });

    // wait for element
    await waitFor(() => {
      expect(getByAltText("QR-Code")).toBeDefined();
    });
  });

  it("should render the QR code with default colors", async () => {
    const spy = vi.spyOn(QRCode, "toDataURL");

    const data = "TESTDATA";
    const { getByAltText } = render(QRCodeImage, {
      props: { data },
    });

    await waitFor(() => {
      expect(getByAltText("QR-Code")).toBeDefined();
      expect(spy).toHaveBeenCalledWith(data, {
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    });
  });

  it("should render the QR code with different colors", async () => {
    const spy = vi.spyOn(QRCode, "toDataURL");

    const data = "TESTDATA";
    const colorDark = "#888888";
    const colorLight = "#cccccc";
    const { getByAltText } = render(QRCodeImage, {
      props: { data, colorDark, colorLight },
    });

    await waitFor(() => {
      expect(getByAltText("QR-Code")).toBeDefined();
      expect(spy).toHaveBeenCalledWith(data, {
        color: {
          dark: colorDark,
          light: colorLight,
        },
      });
    });
  });

  it("should set the data-value attribute for e2e tests", async () => {
    const { getByAltText } = render(QRCodeImage, {
      props: { data: "CHECKIT" },
    });

    await waitFor(() => {
      expect(getByAltText("QR-Code").getAttribute("data-value")).toEqual(
        "CHECKIT"
      );
    });
  });
});
