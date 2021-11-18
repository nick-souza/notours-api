//Module making use of the nodemailer package, to send emails using nodeJs

const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
	//First we nee dot create a transporter, define who sends the email, like gmail. But here using the Mailtrap:
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	//Then, define the email options
	const mailOptions = {
		from: "Natours <natours@natours.io>",
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	//Finally send the email. It returns a promise:
	await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
