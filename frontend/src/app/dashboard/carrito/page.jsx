"use client";

import { Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Script from "next/script";
import {
  SHIPPING_BOX_OPTIONS,
  SHIPPING_BOX_SIZES,
  SHIPPING_METHOD_OPTIONS,
  SHIPPING_METHODS,
  SHIPPING_NOTICE,
  SHIPPING_PROFILE_REQUIRED_MESSAGE,
  SHIPPING_ZONE_OPTIONS,
  SHIPPING_ZONES,
  getEstimatedShippingCost,
  isShippingProfileComplete,
} from "../../../lib/shipping";
import { buildApiUrl } from "../../../lib/api";
import { CartMobile } from "../../../components/cart/CartMobile";

export default function Carrito() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAuth();

  const cartItems = useSelector((state) => state.cart.items);

  const subtotal = Number(cartItems.reduce(
    (sum, item) => sum + (Number(item.precioUnitario) * item.cantidad),
    0
  ).toFixed(2));
  const envio = 0;
  const payableTotal = Number(subtotal.toFixed(2));
  const total = Number((subtotal + envio).toFixed(2));

  const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const [initPoint, setInitPoint] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [shippingProfile, setShippingProfile] = useState(null);
  const [shippingProfileLoading, setShippingProfileLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [shippingSelection, setShippingSelection] = useState({
    shippingMethod: SHIPPING_METHODS.CORREO_ARGENTINO,
    shippingZone: SHIPPING_ZONES.PROVINCIA,
    shippingBoxSize: SHIPPING_BOX_SIZES.CAJA_1,
  });

  const isMinorista = user?.rol?.toUpperCase() === "MINORISTA";
  const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const paymentBrickPreferenceRef = useRef(null);
  const walletBrickPreferenceRef = useRef(null);
  const paymentErrorRef = useRef(null);
  const paymentSectionRef = useRef(null);
  const isPickup =
    shippingSelection.shippingMethod === SHIPPING_METHODS.RETIRO_EN_LOCAL;
  const estimatedShippingCost = isMinorista
    ? getEstimatedShippingCost(shippingSelection)
    : 0;

  const hasCompleteShippingProfile = isShippingProfileComplete(
    shippingProfile || {}
  );
  const showShippingProfileModal =
    !shippingProfileLoading && !hasCompleteShippingProfile && isMinorista;

  const getPaymentFailureMessage = (detail) => {
    const normalizedDetail = String(detail || "").toLowerCase();

    if (
      normalizedDetail.includes("cc_rejected") ||
      normalizedDetail.includes("rejected")
    ) {
      return "El pago fue rechazado por Mercado Pago. Revisa los datos ingresados o proba con otro medio de pago.";
    }

    if (
      normalizedDetail.includes("pending") ||
      normalizedDetail.includes("in_process")
    ) {
      return "El pago quedo pendiente de confirmacion. Si no se acredita, podes intentarlo nuevamente en unos minutos.";
    }

    return "No pudimos completar el pago en este momento. Podes intentarlo nuevamente o elegir otro medio de pago.";
  };

  const getProductsPath = () => {
    const userRole = user?.rol?.toUpperCase();
    if (userRole === "MAYORISTA") {
      return "/mayorista";
    }
    if (userRole === "MINORISTA") {
      return "/#catalogo";
    }
    return "/";
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobileView(window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    if (!user || !isMinorista) {
      setShippingProfile(null);
      setShippingProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        setShippingProfileLoading(true);
        const res = await fetch(buildApiUrl("/users/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Sesión expirada");
          }
          throw new Error("No se pudo cargar el perfil");
        }

        const data = await res.json();
        setShippingProfile(data.perfilMinorista || null);
      } catch (error) {
        console.error("Error al cargar perfil minorista:", error);
      } finally {
        setShippingProfileLoading(false);
      }
    };

    fetchProfile();
  }, [isMinorista, user]);

  // Inicializar Mercado Pago Brick cuando tengamos el preferenceId
  useEffect(() => {
    if (!showPayment) {
      if (window.paymentBrickController) {
        window.paymentBrickController.unmount();
        window.paymentBrickController = null;
      }
      if (window.walletBrickController) {
        window.walletBrickController.unmount();
        window.walletBrickController = null;
      }
      paymentBrickPreferenceRef.current = null;
      walletBrickPreferenceRef.current = null;
      setPaymentAmount(null);
      setPaymentError("");
      return;
    }

    if (!preferenceId || !mounted || !window.MercadoPago || !mpPublicKey) {
      return;
    }

    const paymentContainerId = isMobileView
      ? "paymentBrick_container_mobile"
      : "paymentBrick_container_desktop";
    const paymentBrickRenderKey = `${preferenceId}:${paymentContainerId}`;

    if (paymentBrickPreferenceRef.current === paymentBrickRenderKey && window.paymentBrickController) {
      return;
    }

    if (showPayment && preferenceId && mounted && window.MercadoPago && mpPublicKey) {
      const mp = new window.MercadoPago(mpPublicKey);
      const bricksBuilder = mp.bricks();

      const renderPaymentBrick = async (bricksBuilder) => {
        if (window.paymentBrickController) {
          window.paymentBrickController.unmount();
        }

        const settings = {
          initialization: {
            amount: Number(paymentAmount ?? payableTotal),
            preferenceId: preferenceId,
            mercadoPago: mp,
          },
          customization: {
            visual: {
              style: { theme: "default" },
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              ticket: "all",
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => { },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
              return new Promise((resolve, reject) => {
                const token = localStorage.getItem("token");
                fetch(buildApiUrl("/payments/mercadopago/submit"), {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    preferenceId,
                    formData,
                  }),
                })
                  .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data.error || "No se pudo procesar el pago");
                    }
                    return data;
                  })
                  .then((data) => {
                    if (data.paymentStatus === "PAID" || data.status === "approved" || data.status === "PAID") {
                      dispatch(clearCart());
                      const nextUrl = data.orderId
                        ? `/dashboard/pedidos?mp_status=success&orderId=${encodeURIComponent(data.orderId)}`
                        : "/dashboard/pedidos?mp_status=success";
                      router.push(nextUrl);
                      resolve();
                    } else {
                      const failureMessage = getPaymentFailureMessage(
                        data.statusDetail || data.paymentStatus || data.status
                      );
                      setPaymentError(failureMessage);
                      reject(new Error(failureMessage));
                    }
                  })
                  .catch((error) => {
                    console.error("Error al procesar el pago:", error);
                    const fallbackMessage =
                      error?.message && !String(error.message).includes("localhost")
                        ? error.message
                        : "No pudimos procesar el pago en este momento. Podes intentarlo nuevamente en unos minutos.";
                    setPaymentError(fallbackMessage);
                    reject(error);
                  });
              });
            },
            onError: (error) => {
              console.error("Error en Brick:", error);
              setPaymentError(
                "Hubo un problema al iniciar el medio de pago. Recarga la pagina o intenta nuevamente en unos minutos."
              );
            },
          },
        };
        window.paymentBrickController = await bricksBuilder.create("payment", paymentContainerId, settings);
        paymentBrickPreferenceRef.current = paymentBrickRenderKey;
      };
      renderPaymentBrick(bricksBuilder);
    }
  }, [showPayment, preferenceId, mounted, paymentAmount, payableTotal, mpPublicKey, isMobileView]);

  useEffect(() => {
    if (!showPayment) {
      return;
    }

    // ✅ En mobile NO usamos el Wallet Brick
    if (isMobileView) {
      if (window.walletBrickController) {
        window.walletBrickController.unmount();
        window.walletBrickController = null;
      }
      walletBrickPreferenceRef.current = null;
      return;
    }

    if (!preferenceId || !mounted || !window.MercadoPago || !mpPublicKey) {
      return;
    }

    const mp = new window.MercadoPago(mpPublicKey);
    const bricksBuilder = mp.bricks();
    const walletContainerId = "walletBrick_container_desktop";
    const walletBrickRenderKey = `${preferenceId}:${walletContainerId}`;

    if (
      walletBrickPreferenceRef.current === walletBrickRenderKey &&
      window.walletBrickController
    ) {
      return;
    }

    const renderWalletBrick = async () => {
      if (window.walletBrickController) {
        window.walletBrickController.unmount();
      }

      const settings = {
        initialization: {
          preferenceId,
          redirectMode: "blank",
          mercadoPago: mp,
        },
        customization: {
          texts: {
            action: "pay",
            valueProp: "convenience",
          },
        },
        callbacks: {
          onReady: () => { },
          onError: (error) =>
            console.error("Error en Wallet Brick:", error),
        },
      };

      window.walletBrickController = await bricksBuilder.create(
        "wallet",
        walletContainerId,
        settings
      );

      walletBrickPreferenceRef.current = walletBrickRenderKey;
    };

    renderWalletBrick();
  }, [
    showPayment,
    preferenceId,
    mounted,
    mpPublicKey,
    isMobileView,
  ]);

  useEffect(() => {
    if (shippingError && hasCompleteShippingProfile) {
      setShippingError("");
    }
  }, [shippingError, hasCompleteShippingProfile, shippingSelection]);

  useEffect(() => {
    if (!paymentError || !showPayment) {
      return;
    }

    paymentErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [paymentError, showPayment]);

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ id, cantidad: newQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const formatPrice = (price) => {
    return `$${price.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleMinoristaPaymentFlow = async () => {
    if (cartItems.length === 0 || isSubmitting) return;
    if (!mpPublicKey) {
      alert("Falta configurar NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY");
      return;
    }
    if (!hasCompleteShippingProfile) {
      setShippingError(SHIPPING_PROFILE_REQUIRED_MESSAGE);
      return;
    }
    if (estimatedShippingCost == null) {
      setShippingError("Seleccioná zona y tamaño de caja para continuar.");
      return;
    }

    setShippingError("");
    setPaymentError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(buildApiUrl("/payments/mercadopago/preference"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(shippingSelection),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo iniciar el proceso de pago");
      }
      const data = await res.json();
      setPreferenceId(data.preferenceId);
      setInitPoint(data.initPoint);
      setPaymentAmount(Number(data.amount ?? payableTotal));
      setPaymentError("");
      setShowPayment(true);
      if (window.innerWidth < 768) {
        setTimeout(() => {
          paymentSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 300);
      }
    } catch (error) {
      const message =
        error?.message && !String(error.message).includes("localhost")
          ? error.message
          : "No se pudo iniciar el proceso de pago. Intenta nuevamente en unos minutos.";
      setPaymentError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    const userRole = user?.rol?.toUpperCase();
    const orderType = userRole === "MAYORISTA" ? "MAYORISTA" : "MINORISTA";

    try {
      setIsSubmitting(true);
      const payload = {
        type: orderType,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.cantidad,
        })),
      };

      const res = await fetch(buildApiUrl("/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al crear el pedido");
      }

      const order = await res.json();


      dispatch(clearCart());

      router.push("/dashboard/pedidos");
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />

      {showShippingProfileModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipping-profile-modal-title"
            className="w-full max-w-[min(92vw,28rem)] rounded-2xl bg-white p-4 shadow-2xl sm:p-6 md:max-w-md md:p-7"
          >
            <div className="space-y-3 sm:space-y-4">
              <h2
                id="shipping-profile-modal-title"
                className="text-lg font-bold leading-tight text-gray-900 sm:text-xl md:text-2xl"
              >
                Datos de envío incompletos
              </h2>
              <p className="text-sm leading-6 text-gray-600 sm:text-base">
                {SHIPPING_PROFILE_REQUIRED_MESSAGE}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/pefil")}
              className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:mt-6 sm:text-base"
            >
              Completar datos de envío
            </button>
          </div>
        </div>
      )}

      {/* Título */}
      <div className="bg-white py-6 px-4 md:px-8 text-center border-b">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tu Carrito</h1>
        <p className="text-gray-600">
          Revisá tus productos antes de enviar el pedido
        </p>
      </div>

      {/* MOBILE */}
      <div className="md:hidden px-3 min-[360px]:px-4 pb-6 space-y-4">
        <CartMobile
          cartItems={cartItems}
          handleUpdateQuantity={handleQuantityChange}
          handleRemoveItem={handleRemoveItem}
          formatPrice={(price) =>
            `$${Number(price).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
        />

        {showPayment && (
          <div
            ref={paymentSectionRef}
            className="bg-white rounded-xl border p-3 min-[360px]:p-4 sm:p-6 shadow-sm space-y-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex flex-col min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between gap-2 min-[360px]:gap-3">
                <h2 className="text-xl font-bold">Medios de pago</h2>
                <button
                  onClick={() => setShowPayment(false)}
                  className="self-start min-[360px]:self-auto text-sm text-gray-500 hover:text-red-600"
                >
                  Cancelar y volver
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Elegí si querés pagar con tarjeta u otros medios, o abrir Mercado Pago en una pestaña nueva.
              </p>
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {paymentError}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <img
                  src="/mercadopago.png.webp"
                  alt="Mercado Pago"
                  className="h-10 w-auto"
                />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Continuar con Mercado Pago
                  </h3>

                  <p className="text-sm text-gray-600">
                    Pagá con dinero en cuenta, tarjetas guardadas o cuotas.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => window.location.href = initPoint}
                className="mt-5 w-full rounded-xl border border-sky-600 bg-white py-3 font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Abrir Mercado Pago
              </button>

            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Finalizar pago</h3>
              <div className="w-full max-w-full overflow-hidden">
                <div
                  id="paymentBrick_container_mobile"
                  className="mp-payment-brick-container"
                />
              </div>
            </div>
          </div>
        )}

        {isMinorista && (
          <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Método de envío</h2>
              <p className="text-sm text-gray-600">
                Elegí una opción para calcular un costo estimativo de envío.
              </p>
            </div>

            <div className="grid gap-3">
              {SHIPPING_METHOD_OPTIONS.map((option) => {
                const checked = shippingSelection.shippingMethod === option.value;

                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition ${checked
                      ? "border-red-600 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={option.value}
                      checked={checked}
                      onChange={(e) =>
                        setShippingSelection((prev) => ({
                          ...prev,
                          shippingMethod: e.target.value,
                        }))
                      }
                      className="sr-only"
                    />
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                  </label>
                );
              })}
            </div>

            {!isPickup && (
              <>
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Zona
                  </h3>
                  <div className="grid gap-3">
                    {SHIPPING_ZONE_OPTIONS.map((option) => {
                      const checked = shippingSelection.shippingZone === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-xl border p-4 transition ${checked
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="shippingZone"
                            value={option.value}
                            checked={checked}
                            onChange={(e) =>
                              setShippingSelection((prev) => ({
                                ...prev,
                                shippingZone: e.target.value,
                              }))
                            }
                            className="sr-only"
                          />
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Tamaño estimado de caja
                  </h3>
                  <div className="grid gap-3">
                    {SHIPPING_BOX_OPTIONS.map((option) => {
                      const checked = shippingSelection.shippingBoxSize === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-xl border p-4 transition ${checked
                            ? "border-red-600 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <input
                            type="radio"
                            name="shippingBoxSize"
                            value={option.value}
                            checked={checked}
                            onChange={(e) =>
                              setShippingSelection((prev) => ({
                                ...prev,
                                shippingBoxSize: e.target.value,
                              }))
                            }
                            className="sr-only"
                          />
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Costo estimado de envío</p>
                  <p className="text-xl font-bold text-red-700">
                    {estimatedShippingCost == null
                      ? "-"
                      : formatPrice(estimatedShippingCost)}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{SHIPPING_NOTICE}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>
                {isMinorista
                  ? estimatedShippingCost == null
                    ? "Seleccionar"
                    : `${formatPrice(estimatedShippingCost)} estimado`
                  : "A coordinar"}
              </span>
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="flex justify-between mb-4">
            <span className="font-bold">
              {isMinorista ? "Total a pagar ahora" : "Total"}
            </span>
            <span className="text-xl font-bold text-red-600">
              {formatPrice(total)}
            </span>
          </div>

          {isMinorista && (
            <p className="mb-4 text-xs leading-5 text-gray-600">
              El envío estimado se informa por separado y el valor final será confirmado después de la compra.
            </p>
          )}

          {!(isMinorista && showPayment) ? (
            <button
              onClick={isMinorista ? handleMinoristaPaymentFlow : handleCreateOrder}
              disabled={isSubmitting || cartItems.length === 0}
              className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Procesando..." : isMinorista ? "Pagar Pedido" : "Enviar Pedido"}
            </button>
          ) : (
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
              El pago ya se está completando arriba desde Mercado Pago.
            </p>
          )}
        </div>
      </div>

      <div className="hidden md:block bg-gray-50 py-6 px-4 md:px-8">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row gap-6 items-start">

          <div className="flex-1 w-full space-y-6">
            {showPayment && (
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm border-blue-200 space-y-2">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-xl font-bold">Medios de pago</h2>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      Cancelar y volver
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Elegi si queres pagar con tarjeta u otros medios, o abrir Mercado Pago en una pestaña nueva para usar dinero en cuenta.
                  </p>
                  {paymentError && (
                    <div
                      ref={paymentErrorRef}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                      {paymentError}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <h3 className="font-semibold text-gray-900">
                    Pagar con dinero en cuenta
                  </h3>

                  <p className="text-sm text-gray-600 mt-1 mb-4">
                    Se abre Mercado Pago en otra pestaña para que completes el pago con tu cuenta, con tus medios de pago preferidos o en cuotas sin tarjeta de Mercado Pago.
                  </p>

                  <div className="max-w-[320px] w-full">
                    <div
                      id="walletBrick_container_desktop"
                      className="mp-wallet-brick-container"
                    ></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Finalizar pago</h3>
                  <div
                    id="paymentBrick_container_desktop"
                    className="mp-payment-brick-container"
                  ></div>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-lg border border-[#D9D9D9] overflow-hidden shadow-sm ${showPayment ? 'opacity-40 pointer-events-none' : ''}`}>

              <div className="hidden md:grid bg-red-700 text-white grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3">
                <div className="font-bold">Producto</div>
                <div className="font-bold">Código</div>
                <div className="font-bold">Cantidad</div>
                <div className="font-bold">Precio Unitario</div>
                <div className="font-bold">Total</div>
                <div className="font-bold">Acción</div>
              </div>

              <div className="divide-y">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 px-4 py-4 hover:bg-gray-50 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] md:px-6 md:items-center"
                  >
                    <div>
                      <span className="md:hidden block text-xs font-semibold uppercase text-gray-500">Producto</span>
                      <span className="break-words">{item.nombre}</span>
                    </div>
                    <div className="text-gray-500">
                      <span className="md:hidden block text-xs font-semibold uppercase text-gray-500">Codigo</span>
                      <span className="break-all">{item.codigo}</span>
                    </div>

                    <div>
                      <span className="md:hidden block text-xs font-semibold uppercase text-gray-500">Cantidad</span>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          handleQuantityChange(item.id, Number(e.target.value))
                        }
                        className="w-20 border rounded text-center"
                      />
                    </div>

                    <div>
                      <span className="md:hidden block text-xs font-semibold uppercase text-gray-500">Precio unitario</span>
                      {formatPrice(item.precioUnitario)}
                    </div>
                    <div className="font-bold">
                      <span className="md:hidden block text-xs font-semibold uppercase text-gray-500">Total</span>
                      {formatPrice(item.precioUnitario * item.cantidad)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {isMinorista && (
              <div className={`bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-5 ${showPayment ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">Metodo de envio</h2>
                  <p className="text-sm text-gray-600">
                    Elegi una opcion para calcular un costo estimativo de envio.
                  </p>
                </div>

                {shippingError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {shippingError}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  {SHIPPING_METHOD_OPTIONS.map((option) => {
                    const checked = shippingSelection.shippingMethod === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-xl border p-4 transition ${checked
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={option.value}
                          checked={checked}
                          onChange={(e) =>
                            setShippingSelection((prev) => ({
                              ...prev,
                              shippingMethod: e.target.value,
                            }))
                          }
                          className="sr-only"
                        />
                        <p className="font-semibold text-gray-900">{option.label}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {option.value === SHIPPING_METHODS.RETIRO_EN_LOCAL
                            ? "Costo estimado $0. No requiere zona ni caja."
                            : "Requiere zona y tamano de caja."}
                        </p>
                      </label>
                    );
                  })}
                </div>

                {!isPickup && (
                  <>
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                        Zona
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {SHIPPING_ZONE_OPTIONS.map((option) => {
                          const checked = shippingSelection.shippingZone === option.value;

                          return (
                            <label
                              key={option.value}
                              className={`cursor-pointer rounded-xl border p-4 transition ${checked
                                ? "border-red-600 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                              <input
                                type="radio"
                                name="shippingZone"
                                value={option.value}
                                checked={checked}
                                onChange={(e) =>
                                  setShippingSelection((prev) => ({
                                    ...prev,
                                    shippingZone: e.target.value,
                                  }))
                                }
                                className="sr-only"
                              />
                              <p className="font-semibold text-gray-900">{option.label}</p>
                              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                        Tamano estimado de caja
                      </h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {SHIPPING_BOX_OPTIONS.map((option) => {
                          const checked = shippingSelection.shippingBoxSize === option.value;

                          return (
                            <label
                              key={option.value}
                              className={`cursor-pointer rounded-xl border p-4 transition ${checked
                                ? "border-red-600 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                              <input
                                type="radio"
                                name="shippingBoxSize"
                                value={option.value}
                                checked={checked}
                                onChange={(e) =>
                                  setShippingSelection((prev) => ({
                                    ...prev,
                                    shippingBoxSize: e.target.value,
                                  }))
                                }
                                className="sr-only"
                              />
                              <p className="font-semibold text-gray-900">{option.label}</p>
                              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Costo estimado de envio
                      </p>
                      <p className="text-sm text-gray-600">
                        {isPickup
                          ? "Retiro en local no requiere zona ni caja."
                          : "Definido por la zona y la caja elegidas."}
                      </p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">
                      {estimatedShippingCost == null
                        ? "-"
                        : formatPrice(estimatedShippingCost)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{SHIPPING_NOTICE}</p>
                </div>
              </div>
            )}

            {/* SEGUIR COMPRANDO */}
            <div className="mt-4">
              <button
                onClick={() => router.push(getProductsPath())}
                className="text-red-600 font-medium hover:underline"
              >
                ← Seguir comprando
              </button>
            </div>
          </div>
          <div className="w-full lg:w-[280px] bg-white border rounded-xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>
                  {isMinorista
                    ? estimatedShippingCost == null
                      ? "Seleccionar"
                      : `${formatPrice(estimatedShippingCost)} estimado`
                    : "A coordinar"}
                </span>
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="flex justify-between mb-6">
              <span className="font-bold">
                {isMinorista ? "Total a pagar ahora" : "Total"}
              </span>
              <span className="text-xl font-bold text-red-600">
                {formatPrice(total)}
              </span>
            </div>

            {isMinorista && (
              <p className="mb-4 text-xs leading-5 text-gray-600">
                El envio estimado se informa por separado y el valor final sera confirmado despues de la compra.
              </p>
            )}

            {!(isMinorista && showPayment) ? (
              <button
                onClick={isMinorista ? handleMinoristaPaymentFlow : handleCreateOrder}
                disabled={isSubmitting || cartItems.length === 0}
                className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Procesando..." : isMinorista ? "Pagar Pedido" : "Enviar Pedido"}
              </button>
            ) : (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
                El pago ya se esta completando arriba desde Mercado Pago.
              </p>
            )}
          </div>

        </div>
      </div>


    </>
  );
}
