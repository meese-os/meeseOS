import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useWindowSize } from "@react-hook/window-size/throttled";
import ArticleCard from "./ArticleCard";
import { showArticles } from "../../editable-stuff/configurations.json";

let articles = [];
const Articles = () => {
	const [nextArticle, setNextArticle] = useState([]);
	const [width] = useWindowSize({ fps: 60 });

	// https://github.com/ajmeese7/medium-feed-json
	const getMediumData = useCallback(
		(e) => {
			const url = `https://medium-feed.ajmeese7.workers.dev?next=${nextArticle}`;
			axios
				.get(url)
				.then((response) => response.data)
				.then((response) => {
					if (response.data.posts.length === 0) return;
					articles = articles.concat(response.data.posts);
					setNextArticle(response.next);
				})
				.catch((error) => console.error(error.message))
				.finally(
					() =>
						(articles = articles.sort((a, b) =>
							a.createdAt > b.createdAt ? -1 : 1
						))
				);
		},
		[nextArticle]
	);

	useEffect(() => getMediumData(), [getMediumData]);

	if (!articles.length || !showArticles) {
		document.addEventListener("DOMContentLoaded", (event) => {
			const articlesNavItem = document.querySelectorAll(
				"a[href*='articles']"
			)[0];
			articlesNavItem.parentNode.remove();
		});

		return null;
	}

	return (
		<div
			id="articles"
			className="jumbotron jumbotron-fluid bg-transparent m-0 pb-0"
		>
			<div className={`container container-fluid p-${width > 560 ? "5" : "4"}`}>
				<h1 className="display-4 pb-4">Latest Articles</h1>
				<div className="row">
					{articles.map((article, index) => (
						<ArticleCard key={index} id={index} value={article} index={index} />
					))}
				</div>
			</div>
		</div>
	);
};

export default Articles;
