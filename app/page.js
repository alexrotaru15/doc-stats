"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ChannelPage() {
	const params = useParams();

	const [users, setUsers] = useState([]);
	const [channel, setChannel] = useState(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const observerTarget = useRef(null);
	const PER_PAGE = 100;

	// Fetch channel info
	useEffect(() => {
		const fetchChannel = async () => {
			try {
				const response = await fetch(
					`https://backend-production-3d3c.up.railway.app/api/channels/272573477`
				);
				const data = await response.json();
				setChannel(data);
			} catch (error) {
				console.error("Error fetching channel:", error);
			}
		};

		fetchChannel();
	}, []);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Reset pagination when search term changes
	useEffect(() => {
		setPage(1);
		fetchUsers(1, debouncedSearchTerm);
	}, [debouncedSearchTerm]);

	const fetchUsers = async (pageNum, search = "") => {
		try {
			setLoadingMore(true);
			const response = await fetch(
				`https://backend-production-3d3c.up.railway.app/api/channels/272573477/users?page=${pageNum}&limit=${PER_PAGE}&search=${search}`,
				{
					headers: {
						"ngrok-skip-browser-warning": "true",
					},
				}
			);
			const data = await response.json();

			if (pageNum === 1) {
				setUsers(data.users);
			} else {
				setUsers((prev) => {
					const existingUsers = new Map(prev.map((user) => [user.id, user]));

					data.users.forEach((newUser) => {
						const existingUser = existingUsers.get(newUser.id);
						if (existingUser) {
							// Merge the user data carefully
							existingUsers.set(newUser.id, {
								...existingUser,
								...newUser,
								// Preserve arrays if new data doesn't have them
								UserProfiles: newUser.UserProfiles || existingUser.UserProfiles,
								UserWordStats:
									newUser.UserWordStats || existingUser.UserWordStats,
								Mentions: newUser.Mentions || existingUser.Mentions,
							});
						} else {
							existingUsers.set(newUser.id, newUser);
						}
					});

					const result = Array.from(existingUsers.values());
					return result;
				});
			}

			setHasMore(data.hasMore);
		} catch (error) {
			console.error("Detailed error:", {
				message: error.message,
				stack: error.stack,
			});
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchUsers(1);
	}, []);

	const handleObserver = useCallback(
		(entries) => {
			const target = entries[0];
			if (target.isIntersecting && hasMore && !loadingMore) {
				setPage((prev) => {
					const nextPage = prev + 1;
					fetchUsers(nextPage, debouncedSearchTerm);
					return nextPage;
				});
			}
		},
		[hasMore, loadingMore, debouncedSearchTerm]
	);

	useEffect(() => {
		const observer = new IntersectionObserver(handleObserver, {
			root: null,
			rootMargin: "20px",
			threshold: 1.0,
		});

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current);
			}
		};
	}, [handleObserver]);

	if (loading) {
		return (
			<main className="min-h-screen p-8">
				<div className="text-center">Loading...</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen p-8">
			<div className="flex flex-col gap-8 max-w-4xl mx-auto">
				<div className="flex items-center gap-4">
					<h1 className="text-3xl font-bold">
						{channel?.displayName || "Channel"} Chat Stats (2 februarie - 11
						aprilie)
					</h1>
				</div>

				<div className="relative">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search users..."
						className="w-full px-4 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
						>
							×
						</button>
					)}
				</div>

				<div className="grid gap-6">
					{users.map((user) => (
						<div
							key={user.id}
							className="bg-black/40 rounded-lg p-6 hover:bg-black/60 transition-colors border border-zinc-800/40 relative"
						>
							<div className="absolute -left-4 -top-4 w-8 h-8 bg-zinc-900 rounded-full border border-zinc-800/40 flex items-center justify-center">
								<span className="text-sm font-medium text-zinc-400">
									#{user.globalRank}
								</span>
							</div>
							<div className="flex items-center gap-4">
								{user.logo && (
									<img
										src={user.logo}
										alt={user.displayName}
										className="w-16 h-16 rounded-full"
									/>
								)}
								<div className="flex-grow">
									<h2 className="text-xl font-semibold">{user.displayName}</h2>
									<p className="text-zinc-400">@{user.name}</p>
								</div>
								<div className="text-right">
									<div className="text-2xl font-bold">{user.doc_messages}</div>
									<div className="text-sm text-zinc-400">messages</div>
									<div className="text-sm text-zinc-400">
										{user.doc_messages_percentage}% of chat
									</div>
								</div>
							</div>

							{user.bio && <p className="mt-4 text-zinc-300">{user.bio}</p>}

							<div className="mt-4 grid gap-4">
								{/* Word Stats Section */}
								{user.UserWordStats && user.UserWordStats.length > 0 && (
									<div className="bg-black/40 rounded-lg p-4 border border-zinc-800/40">
										<h3 className="font-semibold mb-3 text-sm">
											Most Used Words
										</h3>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
											{[...user.UserWordStats]
												.sort((a, b) => b.count - a.count)
												.map((stat) => (
													<div
														key={stat.word}
														className="bg-zinc-900/40 rounded-lg p-2 text-center border border-zinc-800/20"
													>
														<div className="font-medium text-sm">
															{stat.word}
														</div>
														<div className="text-xs text-zinc-400">
															{stat.count} times
														</div>
													</div>
												))}
										</div>
									</div>
								)}
								{/* Most Mentioned Users Section */}
								{user.Mentions && user.Mentions.length > 0 && (
									<div className="bg-black/40 rounded-lg p-4 border border-zinc-800/40">
										<h3 className="font-semibold mb-3 text-sm">
											Most Mentioned Users
										</h3>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
											{[...user.Mentions]
												.sort((a, b) => b.count - a.count)
												.map((mention) => (
													<div
														key={mention.mentionedUser}
														className="bg-zinc-900/40 rounded-lg p-2 text-center border border-zinc-800/20"
													>
														<div className="font-medium text-sm">
															@{mention.mentionedUser}
														</div>
														<div className="text-xs text-zinc-400">
															{mention.count} mentions
														</div>
													</div>
												))}
										</div>
									</div>
								)}
								{/* Profile Section */}
								{user.UserProfiles && user.UserProfiles[0] && (
									<div className="bg-black/40 rounded-lg p-4 border border-zinc-800/40">
										<div className="text-sm">
											<h3 className="font-semibold mb-2">Profile Analysis</h3>
											<p className="text-zinc-300">
												{user.UserProfiles[0].profile}
											</p>
										</div>

										{user.UserProfiles[0].personality_traits && (
											<div className="text-sm mt-4">
												<h4 className="font-semibold mb-1">
													Personality Traits
												</h4>
												<div className="flex flex-wrap gap-2">
													{user.UserProfiles[0].personality_traits.map(
														(trait, index) => (
															<span
																key={index}
																className="px-2 py-1 bg-zinc-900/40 rounded-full text-xs"
															>
																{trait}
															</span>
														)
													)}
												</div>
											</div>
										)}

										{user.UserProfiles[0].interests && (
											<div className="text-sm mt-4">
												<h4 className="font-semibold mb-1">Interests</h4>
												<div className="flex flex-wrap gap-2">
													{user.UserProfiles[0].interests.map(
														(interest, index) => (
															<span
																key={index}
																className="px-2 py-1 bg-zinc-900/40 rounded-full text-xs"
															>
																{interest}
															</span>
														)
													)}
												</div>
											</div>
										)}

										<div className="grid grid-cols-2 gap-4 text-sm mt-4">
											{user.UserProfiles[0].sports_team && (
												<div>
													<h4 className="font-semibold mb-1">Sports Team</h4>
													<p className="text-zinc-300">
														{user.UserProfiles[0].sports_team}
													</p>
												</div>
											)}

											{user.UserProfiles[0].political_preference && (
												<div>
													<h4 className="font-semibold mb-1">
														Political Preference
													</h4>
													<p className="text-zinc-300">
														{user.UserProfiles[0].political_preference}
													</p>
												</div>
											)}

											{user.UserProfiles[0].communication_style && (
												<div>
													<h4 className="font-semibold mb-1">
														Communication Style
													</h4>
													<p className="text-zinc-300">
														{user.UserProfiles[0].communication_style}
													</p>
												</div>
											)}
										</div>

										{user.UserProfiles[0].favorite_celebrities &&
											user.UserProfiles[0].favorite_celebrities.length > 0 && (
												<div className="text-sm mt-4">
													<h4 className="font-semibold mb-1">
														Favorite Celebrities
													</h4>
													<div className="flex flex-wrap gap-2">
														{user.UserProfiles[0].favorite_celebrities.map(
															(celebrity, index) => {
																const displayName =
																	typeof celebrity === "string"
																		? celebrity
																		: celebrity.nume;

																return (
																	<span
																		key={index}
																		className="px-2 py-1 bg-zinc-900/40 rounded-full text-xs group relative"
																		title={celebrity.rol || ""}
																	>
																		{displayName}
																		{celebrity.rol && (
																			<span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
																				{celebrity.rol}
																			</span>
																		)}
																	</span>
																);
															}
														)}
													</div>
												</div>
											)}

										<div className="text-xs text-zinc-400 mt-4">
											Last updated:{" "}
											{new Date(
												user.UserProfiles[0].last_updated
											).toLocaleDateString()}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{hasMore && (
					<div
						ref={observerTarget}
						className="flex justify-center py-8"
					>
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
					</div>
				)}
			</div>
		</main>
	);
}
