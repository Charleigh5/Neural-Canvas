
import React from 'react';
import { motion } from 'framer-motion';

export const NeuralLogo: React.FC = () => {
    const letters = "STUDIO.OS".split("");

    const containerVariants = {
        animate: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.3
            }
        }
    };

    const letterVariants = {
        initial: (i: number) => {
            const angle = (i / letters.length) * Math.PI * 2;
            const radius = 800;
            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: -1000,
                opacity: 0,
                scale: 3,
                rotateX: Math.random() * 720,
                rotateY: Math.random() * 720,
                filter: "blur(30px)"
            };
        },
        animate: (i: number) => ({
            x: [null, 0, 0], 
            y: [null, 0, 0],
            z: [null, 200, 0],
            opacity: [0, 1, 1],
            scale: [3, 1.8, 1],
            rotateX: [null, 0, 0],
            rotateY: [null, 0, 0],
            filter: ["blur(30px)", "blur(0px)", "blur(0px)"],
            transition: {
                duration: 2.2,
                times: [0, 0.7, 1],
                ease: "circOut" as const
            }
        })
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="flex items-center justify-center gap-1 md:gap-2 h-24 mb-4 select-none pointer-events-none"
            style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
        >
            {letters.map((char, i) => (
                <div key={i} className="relative">
                    <motion.span
                        custom={i}
                        variants={letterVariants}
                        className={`
                            text-5xl md:text-7xl font-black tracking-tighter inline-block
                            ${char === '.' ? 'text-indigo-500' : 'text-white'}
                        `}
                        style={{
                            textShadow: char === '.' 
                                ? '0 0 30px rgba(99, 102, 241, 0.9)' 
                                : '0 0 50px rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        {char}
                    </motion.span>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ 
                            opacity: [0, 0.6, 0], 
                            scale: [1, 3, 5] 
                        }}
                        transition={{ 
                            delay: 0.3 + (i * 0.08) + 1.4, 
                            duration: 1.0,
                            ease: "easeOut"
                        }}
                        className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl -z-10"
                    />
                </div>
            ))}
        </motion.div>
    );
};
