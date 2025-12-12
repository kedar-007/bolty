"use client";

import { SunDim, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { motion } from 'motion/react'

interface OuterLayerProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

const OuterLayer = ({ children, className, onClick }: OuterLayerProps) => {
	return (
		<button className={cn("flex items-center justify-center rounded-full bg-white dark:bg-black/50 h-[2rem] w-[2rem]", className)}
			onClick={onClick}
		>
			{children}
		</button>
	)
}

export const ThemeButton = () => {
	const { setTheme } = useTheme();

	return (
		<div className="flex items-center gap-2 justify-center bg-zinc-100 dark:bg-zinc-900 cursor-pointer rounded-3xl border hover:border-teal-800">
			<div className={cn("flex h-fit w-15 dark:justify-end justify-start")}>
				<motion.div layout transition={{ type: "spring", visibility: 0.2, bounce: 0.2 }}>
					<OuterLayer className="hidden dark:flex" onClick={() => setTheme("light")}>
						<Moon className="h-[1rem] w-[1rem]" />
					</OuterLayer>
					<OuterLayer className="flex dark:hidden" onClick={() => setTheme("dark")}>
						<SunDim className="h-[0.9rem] w-[0.9em]" />
					</OuterLayer>
				</motion.div>
			</div>
		</div>
	)
}
