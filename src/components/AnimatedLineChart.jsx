import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export function AnimatedLineChart() {
  const controls = useAnimation();
  const alertControls = useAnimation();
  const [isAlert, setIsAlert] = useState(false);

  // Example data points for supply (green) and consumption (red spike)
  // X range: 0 to 800, Y range: 0 to 300
  const supplyPath = "M 0 150 C 100 150, 200 100, 300 120 C 400 140, 500 200, 600 180 C 700 160, 800 150, 900 150";
  const smoothConsumption = "M 0 160 C 100 160, 200 110, 300 130 C 400 150, 500 210, 600 190 C 700 170, 800 160, 900 160";
  // The anomaly spike path goes way above the supply path at x=500
  const anomalyPath = "M 0 160 C 100 160, 200 110, 300 130 C 400 150, 450 50, 500 20 C 550 50, 600 190, 700 170 C 800 160, 900 160, 900 160"; 

  useEffect(() => {
    const sequence = async () => {
      // 1. Draw both base lines
      await controls.start("draw");
      
      // 2. Wait a bit, then morph the consumption line into an anomaly
      await new Promise(r => setTimeout(r, 1000));
      setIsAlert(true);
      await controls.start("spike");
      
      // 3. Pulse the alert UI
      alertControls.start({
        opacity: [0.5, 1, 0.5],
        scale: [0.95, 1.05, 0.95],
        transition: { repeat: Infinity, duration: 1.5 }
      });
      
      // 4. Return to normal after a couple seconds
      await new Promise(r => setTimeout(r, 3000));
      setIsAlert(false);
      alertControls.stop();
      alertControls.set({ opacity: 0 }); // Hide it again
      await controls.start("normal");
      
      // Loop sequence
      setTimeout(sequence, 2000);
    };

    sequence();
  }, [controls, alertControls]);

  return (
    <div className="relative w-full h-full p-4 overflow-hidden rounded-xl border border-border-grid bg-bg1/40 backdrop-blur-sm shadow-2xl">
      <div className="absolute top-4 left-4 flex gap-3 text-[10px] uppercase font-bold tracking-widest text-t3">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-grid-green"></span> Grid Supply</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-grid-red"></span> Measured Load</div>
      </div>
      
      {/* Alert Banner / Glow */}
      <motion.div 
        animate={alertControls}
        initial={{ opacity: 0 }}
        className="absolute top-4 right-4 bg-grid-red/10 border border-grid-red text-grid-red px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
      >
        <span className="w-2 h-2 rounded-full bg-grid-red animate-ping" />
        Anomaly Detected
      </motion.div>

      <div className="w-full h-full pt-12">
        <svg viewBox="0 0 900 300" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <g className="stroke-border-grid/50" strokeWidth="1" strokeDasharray="4 4">
            <line x1="0" y1="50" x2="900" y2="50" />
            <line x1="0" y1="150" x2="900" y2="150" />
            <line x1="0" y1="250" x2="900" y2="250" />
          </g>

          {/* Supply Line (Green) */}
          <motion.path
            d={supplyPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            filter="drop-shadow(0px 4px 8px rgba(16,185,129,0.3))"
            variants={{
              draw: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } },
              initial: { pathLength: 0, opacity: 0 }
            }}
            initial="initial"
            animate={controls}
          />
          
          {/* Consumption Line (Red) */}
          <motion.path
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            filter="drop-shadow(0px 4px 8px rgba(239,68,68,0.4))"
            variants={{
              initial: { pathLength: 0, opacity: 0, d: smoothConsumption },
              draw: { pathLength: 1, opacity: 1, d: smoothConsumption, transition: { duration: 1.5, ease: "easeInOut" } },
              spike: { d: anomalyPath, stroke: "#ef4444", transition: { type: "spring", stiffness: 60, damping: 10 } },
              normal: { d: smoothConsumption, transition: { type: "spring", stiffness: 60, damping: 15 } }
            }}
            initial="initial"
            animate={controls}
          />

          {/* Fill effect under consumption line */}
          <motion.path
            fill="url(#redGradient)"
            opacity={0.3}
            variants={{
              initial: { d: smoothConsumption + " L 900 300 L 0 300 Z", opacity: 0 },
              draw: { d: smoothConsumption + " L 900 300 L 0 300 Z", opacity: 0.1, transition: { duration: 1 } },
              spike: { d: anomalyPath + " L 900 300 L 0 300 Z", opacity: 0.25, transition: { type: "spring", stiffness: 60, damping: 10 } },
              normal: { d: smoothConsumption + " L 900 300 L 0 300 Z", opacity: 0.1, transition: { type: "spring", stiffness: 60, damping: 15 } }
            }}
            initial="initial"
            animate={controls}
          />
          
          <defs>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Floating Risk Card */}
      <motion.div 
        animate={{ 
          y: isAlert ? -10 : 0, 
          borderColor: isAlert ? 'rgba(239, 68, 68, 0.5)' : 'rgba(30, 45, 69, 1)' 
        }}
        className="absolute bottom-6 right-6 bg-bg2 border border-border-grid rounded-lg p-3 shadow-xl backdrop-blur-md"
      >
        <div className="text-[10px] text-t3 uppercase font-bold mb-1 tracking-widest">Calculated Risk</div>
        <motion.div 
          animate={{ color: isAlert ? '#ef4444' : '#10b981' }}
          className="text-2xl font-chakra font-bold text-grid-green"
        >
          {isAlert ? '89%' : '12%'}
        </motion.div>
      </motion.div>
    </div>
  );
}
