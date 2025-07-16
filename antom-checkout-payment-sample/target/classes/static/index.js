/**
 * The integration method of the Antom API.
 */

window.selectedPaymentOptionId = "PAYPAY";
window.amount = { currency: "JPY", value: "6000", mul: 1 };

const paymentOptions = [
	{
		class: "JP",
		label: "PayPay",
		value: "PAYPAY",
		icon: "https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*mfRjRoV-rL4AAAAAAAAAAAAAAQAAAQ",
	},
	{
		class: "JP",
		label: "Konbini",
		value: "KONBINI",
		icon: "https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*MfnBTYHOr5cAAAAAAAAAAAAAAQAAAQ",
	},
	{
		class: "JP",
		label: "Pay-easy",
		value: "BANKTRANSFER_PAYEASY",
		icon: "https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*VhfgTLFuYOgAAAAAAAAAAAAAAQAAAQ",
	},
];

// Step 1: Get payment session data from the endpoint and rediret to external pages.async function handleSubmit() {
	async function doPayment() {
		setBtnLoading(true);
		if (!window.selectedPaymentOptionId) {
			showAlert("Waring", "Please select a payment method!", "warning");
			return;
		}

		// Define the URL for your backend endpoint
		const url = "http://localhost:8080/payment/pay";

		const config = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({

				// in practice, amount should be calculated on your server side
				amountValue: window.amount.value,
				currency: window.amount.currency,
				paymentMethodType: window.selectedPaymentOptionId,
			}),
		};
		try {
			const response = await fetch(url, config);
			if (!response.ok) {
				throw new Error("HTTP error! Status: " + response.status);
			}
			const res = await response.json();
			if (res.status === "success") return res;
			throw new Error(res.message || "Invalid response format");
		} catch (error) {
			showAlert(
				"Error",
				error.message || "Failed to fetch payment normalUrl data",
				"error"
			);
			return null;
		} finally {
			setBtnLoading(false);
		}
	}	try {
		const paymentResponse = await doPayment();		window.top.location.href = paymentResponse.data.normalUrl;	} catch (error) {
		showAlert(error.code, error.message || "Failed to process payment", "error");
	}
}

// Step 2: Call inquiryPayment endpoint to get the payment status.async function inquiryPayment(paymentRequestId) {

	// Define the URL for your backend endpoint
	const url = "http://localhost:8080/payment/inquiryPayment";

	const config = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ paymentRequestId }),
	};

	const response = await fetch(url, config);
	if (!response.ok) throw new Error("Network response was not ok");

	const res = await response.json();
	return res.status === "success" ? res.data.paymentStatus : "ERROR";
} 
// Step 3: Create Polling mechanism  to retrieve the payment result.
async function pollPaymentResult() {
	const paymentRequestId = new URLSearchParams(window.location.search).get(
		"paymentRequestId"
	);
	if (!paymentRequestId) return;

	const poll = async () => {
		let status = "PROCESSING";
		let retries = 0;
		const maxRetries = 5;

		while (retries < maxRetries) {
			try {
				const statusResult = await inquiryPayment(paymentRequestId);
				status = statusResult ?? "ERROR";
			} catch (error) {
				status = "ERROR";
			}

			retries += 1;

			if (status === "SUCCESS" || retries === maxRetries) {
				return handlePaymentStatus(status);
			}

			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	};

	poll();
}

// Step 3: Bind handleSubmit function to submit button.
document.getElementById("submit").addEventListener("click", handleSubmit);

// Step 4: Render payment options & check start polling result.
document.addEventListener("DOMContentLoaded", () => {
	appendPaymentOptions(paymentOptions);
	pollPaymentResult();
});

// ------- User Interaction Section -------


function appendPaymentOptions(options) {
	const paymentOptionsContainer = document.getElementById("checkout-box");
	paymentOptionsContainer.innerHTML = "";

	const frag = document.createDocumentFragment();
	options.forEach((option) => {
		const label = document.createElement("label");
		label.className = "payment-option " + option.class;

		const input = document.createElement("input");
		input.type = "radio";
		input.className = "radio-input";
		input.name = "radio";
		input.value = option.value;
		input.checked = option.value === window.selectedPaymentOptionId;
		if (input.checked) {
			label.classList.add("selected");
		}
		input.addEventListener("change", selectPaymentOption);

		const span = document.createElement("span");
		span.className = "radio-button";

		const icon = document.createElement("img");
		icon.src = option.icon;
		icon.className = "payment-icon";

		const textNode = document.createTextNode(option.label);
		label.append(input, span, icon, textNode);

		frag.appendChild(label);
	});

	paymentOptionsContainer.appendChild(frag);
}

function selectPaymentOption(event) {
	const targetValue = event.target.value;
	if (targetValue) {
		document
			.querySelectorAll(".payment-option")
			.forEach((label) => label.classList.remove("selected"));

		const selectedLabel = event.target.parentElement;
		selectedLabel.classList.add("selected");
		window.selectedPaymentOptionId = targetValue;
	}
}

function handlePaymentStatus(status) {
	switch (status) {
		case "SUCCESS":
			showPaymentResult(
				"Payment Successful",
				"Thank you for your payment! We will ship out your order as soon as possible.",
				"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*ZLggSbkLKoMAAAAAAAAAAAAAAQAAAQ",
				"#e5f7f1",
				"#b7e9d9"
			);
			break;
		case "FAIL":
			showPaymentResult(
				"Payment Failed",
				"Please return to the merchant order page and resubmit your payment.",
				"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*QzBHQ40jKZAAAAAAAAAAAAAAAQAAAQ",
				"rgba(255, 91, 77, 0.10)",
				"rgba(255, 91, 77, 0.20)"
			);
			break;
		case "ERROR":
			showPaymentResult(
				"Error",
				"An error occurred while checking the payment status. Please try again or contact support.",
				"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*QzBHQ40jKZAAAAAAAAAAAAAAAQAAAQ",
				"rgba(255, 91, 77, 0.10)",
				"rgba(255, 91, 77, 0.20)"
			);
			break;
		default:
			showPaymentResult(
				"Payment Processing",
				"Please return to the merchant order page and resubmit your payment.",
				"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*7ShHRKjYcjoAAAAAAAAAAAAAAQAAAQ",
				"rgba(255, 159, 26, 0.10)",
				"rgba(255, 159, 26, 0.20) "
			);
	}
}

function showPaymentResult(title, message, icon, bgColor, borderColor) {
	const messageContainer = document.querySelector("#result-container");
	if (!messageContainer) return;

	messageContainer.classList.remove("hidden");
	messageContainer.style.backgroundColor = bgColor;
	messageContainer.style.borderColor = borderColor;

	document.getElementById("message").innerText = title;
	document.getElementById("content").innerText = message;
	document.getElementById("resultIcon").setAttribute("src", icon);

	setTimeout(() => {
		messageContainer.classList.add("hidden");
		messageContainer.style.backgroundColor = "";
		messageContainer.style.borderColor = "";
		document.getElementById("message").innerText = "";
		document.getElementById("content").innerText = "";
		document.getElementById("resultIcon").setAttribute("src", "");
		window.location.href = "./index.html";
	}, 8000);
}

function setBtnLoading(isLoading) {
	const submitElement = document.getElementById("submit");
	submitElement.disabled = isLoading;
	submitElement.classList.toggle("disabled", isLoading);
}

function showAlert(title, subTitle, type) {
	const icons = {
		warning:
			"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*7ShHRKjYcjoAAAAAAAAAAAAAAQAAAQ",
		error:
			"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*QzBHQ40jKZAAAAAAAAAAAAAAAQAAAQ",
		success:
			"https://mdn.alipayobjects.com/portal_pdqp4x/afts/file/A*ZLggSbkLKoMAAAAAAAAAAAAAAQAAAQ",
	};

	const containerDesktop = document.getElementById("container-desktop");
	const mockup = document.getElementById("mockup");
	const alertIcon = document.getElementById("alert-icon");
	const containerTitle = document.getElementById("container-title");
	const containerSubTitle = document.getElementById("container-subTitle");

	containerDesktop.style.display = "block";
	mockup.style.display = "block";
	alertIcon.src = icons[type] || "";
	containerTitle.textContent = title || "";
	containerSubTitle.textContent = subTitle || "";
	alertIcon.style.display = icons[type] ? "block" : "none";
	containerTitle.style.display = title ? "block" : "none";
	containerSubTitle.style.display = subTitle ? "block" : "none";
}

function closeAlert() {
	document.getElementById("container-desktop").style.display = "none";
	document.getElementById("mockup").style.display = "none";
}

document.getElementById("alert-ok-btn").addEventListener("click", closeAlert);
