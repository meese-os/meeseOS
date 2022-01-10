<form id="contactForm" method="post" action="contactSiteOwner.php" target="invisible"> <!--  -->
	<label for="name">Name:</label>
	<input type="text" name="name" placeholder="Your Name Here" required>

	<label for="email">Email:</label>
	<input type="email" name="email" placeholder="your@email.address" required>

	<label for="subject">Subject:</label>
	<input type="text" name="subject" placeholder="Subject" required>

	<label for="message">Brief Message:</label>
	<textarea name="message" rows="5"></textarea>

	<input id="sendMessage" type="submit">
</form>

<iframe name="invisible" style="display:none;"></iframe>
<!--  -->