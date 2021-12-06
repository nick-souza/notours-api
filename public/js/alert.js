//File to display messages if the user is logged in or inputs wrong credentials:

//Function that will remove the alerts:
export const hideAlert = () => {
	const el = document.querySelector(".alert");
	if (el) el.parentElement.removeChild(el);
};

//Function to create new alerts:
export const showAlert = (type, msg) => {
	//Removing any previous alerts:
	hideAlert();

	//Adding new one:
	const markup = `<div class="alert alert--${type}">${msg}</div>`;
	document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

	//Removing after 5sec:
	window.setTimeout(hideAlert, 5000);
};
