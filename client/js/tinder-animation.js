'use strict';

const tinderContainer = document.querySelector('.tinder');
const nope = document.getElementById('nope');
const love = document.getElementById('love');
const dietaryRestriction = document.getElementById('dietary-restriction');

// const base_url = `http://chickentinder.tech/`;
const base_url = `https://chicken-tinder-dubhacks.herokuapp.com`;

const urlParams = new URLSearchParams(window.location.search);
const memberName = urlParams.get('member');

let recipes = [];

let allCards = [];
addCard().then(() => { // wait for addCard async function that fetches recipe JSON
	initCards();
	allCards = document.querySelectorAll('.tinder--card');
	setupSwipe();
});

function initCards(card, index) {
	var newCards = document.querySelectorAll('.tinder--card:not(.removed)');

	newCards.forEach(function (card, index) {
		card.style.zIndex = allCards.length - index;
		card.style.transform = 'scale(' + (20 - index) / 20 + ') translateY(-' + 30 * index + 'px)';
		card.style.opacity = (10 - index) / 10;
	});

	if (!newCards.length) {
		document.getElementById("restart").style.visibility = "visible";
		document.getElementById("complete").style.visibility = "visible";

		nope.disabled = true;
		love.disabled = true;
	} else {
		document.getElementById("restart").style.visibility = "hidden";
		document.getElementById("complete").style.visibility = "hidden";

		nope.disabled = false;
		love.disabled = false;
	}

	tinderContainer.classList.add('loaded');
}

function resetState() {
	allCards.forEach(c => {
		c.classList.remove("removed");
	});
	initCards();
}

async function submitResponse() {
	document.getElementById("restart").style.visibility = "hidden";
	document.getElementById("complete").style.visibility = "hidden";
	const json = JSON.stringify({ 'responses': recipes });
	const response = fetch(`/party/${groupID}/recipes?` + new URLSearchParams({
		member: memberName
	}), {
		method: 'POST',
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json'
		},
		body: json,
	});
	showPopUp();
	setTimeout(() => { hidePopUp() }, 2500);
}

function showPopUp() {
	document.getElementById('pop-up').style.visibility = "visible";
	document.getElementById('pop-up').style.display = "block";
}

function hidePopUp() {
	document.getElementById('pop-up').style.visibility = "hidden";
	document.getElementById('pop-up').style.display = "none";
}

async function addCard() {
	const url = 'https://chicken-tinder-dubhacks.herokuapp.com/api/recipes';

	try {
		const response = await fetch(url);
		const isJson = response.headers.get('content-type')?.includes('application/json');
		const data = isJson && (await response.json());

		// check for error response
		if (!response.ok) {
			// get error message from body or default to response status
			const error = data?.message || response.status;
			throw error;
		}

		// Following tidbit is missing ability to show all ingredients
		// const foodHTML = data.recipes.map((recipe) =>
		// 	`<div class="tinder--card">
		// 		<div style="background-image:url(${recipe.image_url})"></div>
		// 		<h3>${recipe.recipe_name}</h3>
		// 		<p></p>
		// 	</div>`
		// ).join('');
		// document.querySelector('.tinder--cards').insertAdjacentHTML('beforeend', foodHTML);
		// Create Tinder cards via provided recipe data
		for (let i = 0; i < data.recipes.length; i++) {
			recipes = [...recipes, 0];
			const foodHTML = `<div class="tinder--card" index=${i}>
				<div class="image-div" style="background-image:url(${data.recipes[i].image_url})"></div>
				<div class="text-div">
					<h2>${data.recipes[i].recipe_name}</h3>
					<strong>${data.recipes[i].description}</strong>
					<p><strong>Ingredients:</strong></p>
					<ul>${data.recipes[i].ingredients.map(ing => `<li>${ing.name}</li>`).join('')}</ul>
				</div>
			</div>`;
			document.querySelector('.tinder--cards').insertAdjacentHTML('beforeend', foodHTML);
		}
		const restartButton = `<button class="end-button button-red" id="restart" style="visibility:hidden" onclick="resetState()">Swipe again</button>`;
		const completeButton = `<button class="end-button button-red" id="complete" style="visibility:hidden" onclick="submitResponse()">I'm done swiping</button>`;
		document.querySelector('.tinder--cards').insertAdjacentHTML('beforeend', completeButton + restartButton);
	} catch (error) {
		console.error('There was an error.', error);
	}
}

function setupSwipe() {
	for (let i = 0; i < allCards.length; i++) {
		let el = allCards[i];
		var hammertime = new Hammer(el);

		hammertime.on('pan', function (event) {
			el.classList.add('moving');
		});

		hammertime.on('pan', function (event) {
			if (event.deltaX === 0) return;
			if (event.center.x === 0 && event.center.y === 0) return;

			tinderContainer.classList.toggle('tinder_love', event.deltaX > 0);
			tinderContainer.classList.toggle('tinder_nope', event.deltaX < 0);

			var xMulti = event.deltaX * 0.03;
			var yMulti = event.deltaY / 80;
			var rotate = xMulti * yMulti;

			event.target.style.transform =
				'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)';
		});

		hammertime.on('panend', function (event) {
			el.classList.remove('moving');
			// tinder_love and tinder_nope for overall container, not cards
			tinderContainer.classList.remove('tinder_love');
			tinderContainer.classList.remove('tinder_nope');

			var moveOutWidth = document.body.clientWidth;
			// Fine-tune for drag sensitivity
			var keep = Math.abs(event.deltaX) < 60 || Math.abs(event.velocityX) < 0.4;
			//var keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;

			event.target.classList.toggle('removed', !keep);

			if (keep) {
				event.target.style.transform = '';
			} else {
				var endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
				var toX = event.deltaX > 0 ? endX : -endX;
				var endY = Math.abs(event.velocityY) * moveOutWidth;
				var toY = event.deltaY > 0 ? endY : -endY;
				var xMulti = event.deltaX * 0.03;
				var yMulti = event.deltaY / 80;
				var rotate = xMulti * yMulti;

				recipes[el.getAttribute("index")] = (toX > 0) ? 1 : 0; // right : left
				console.log(recipes);

				event.target.style.transform = 'translate(' + toX + 'px, ' + (toY + event.deltaY) + 'px) rotate(' + rotate + 'deg)';
				initCards();
			}
		});
	}
}


function createButtonListener(love) {
	return function (event) {
		var cards = document.querySelectorAll('.tinder--card:not(.removed)');
		var moveOutWidth = document.body.clientWidth * 0.65; // Fine-tune for drag sensitivity
		//var moveOutWidth = document.body.clientWidth * 1.5;

		if (!cards.length) return false;

		var card = cards[0];

		card.classList.add('removed');

		if (love) {
			//console.log("right");
			card.style.transform = 'translate(' + moveOutWidth + 'px, -100px) rotate(-30deg)';
		} else {
			//console.log("left");
			card.style.transform = 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)';
		}

		recipes[card.getAttribute("index")] = (love) ? 1 : 0; // right : left
		//console.log(recipes);
		initCards();
		// allCards = document.querySelectorAll('.tinder--card');
		// setupSwipe();

		event.preventDefault();
	};
}

function dietRestriction() {
	var cards = document.querySelectorAll('.tinder--card:not(.removed)');
	var card = cards[0];
	var moveOutWidth = document.body.clientWidth * 0.65; // Fine-tune for drag sensitivity
	recipes[card.getAttribute("index")] = 2; // 2 designating not an option for any user
	card.classList.add('removed');
	card.style.transform = 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)';
	// console.log(recipes);
	initCards();
}

const nopeListener = createButtonListener(false);
const loveListener = createButtonListener(true);

nope.addEventListener('click', nopeListener);
love.addEventListener('click', loveListener);
dietaryRestriction.addEventListener('click', dietRestriction);
