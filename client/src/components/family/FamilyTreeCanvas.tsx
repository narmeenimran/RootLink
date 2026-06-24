import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, Move } from 'lucide-react';
import type { FamilyTreeLayout, FamilyTreeNode } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import {
  getTreeConnectorPath,
  TREE_CARD_HEIGHT,
  TREE_CARD_WIDTH,
} from '@/utils/familyTreeLayout';

interface FamilyTreeCanvasProps {
  layout: FamilyTreeLayout;
  selectedHeadId: string | null;
  onSelectHead: (headId: string) => void;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.75;

export function FamilyTreeCanvas({
  layout,
  selectedHeadId,
  onSelectHead,
}: FamilyTreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || !layout.width || !layout.height) return;

    const padding = 48;
    const scaleX = (container.clientWidth - padding) / layout.width;
    const scaleY = (container.clientHeight - padding) / layout.height;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), 1);

    setTransform({
      scale,
      x: (container.clientWidth - layout.width * scale) / 2,
      y: (container.clientHeight - layout.height * scale) / 2,
    });
  }, [layout.height, layout.width]);

  useEffect(() => {
    fitToView();
  }, [fitToView, layout.nodes.length, layout.width, layout.height]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    const nextScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, transform.scale + delta)
    );
    const scaleRatio = nextScale / transform.scale;

    setTransform({
      scale: nextScale,
      x: mouseX - (mouseX - transform.x) * scaleRatio,
      y: mouseY - (mouseY - transform.y) * scaleRatio,
    });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-tree-node]')) return;
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!isPanning) return;
    setTransform((current) => ({
      ...current,
      x: panStart.current.originX + (event.clientX - panStart.current.x),
      y: panStart.current.originY + (event.clientY - panStart.current.y),
    }));
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const zoomBy = (delta: number) => {
    const container = containerRef.current;
    if (!container) return;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const nextScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, transform.scale + delta)
    );
    const scaleRatio = nextScale / transform.scale;
    setTransform({
      scale: nextScale,
      x: centerX - (centerX - transform.x) * scaleRatio,
      y: centerY - (centerY - transform.y) * scaleRatio,
    });
  };

  const connectors: Array<{ key: string; path: string }> = [];
  for (const node of layout.nodes) {
    for (const child of node.children) {
      connectors.push({
        key: `${node.headId}-${child.headId}`,
        path: getTreeConnectorPath(node, child),
      });
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomBy(-0.12)} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-12 text-center text-xs text-muted-foreground">
          {Math.round(transform.scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomBy(0.12)} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToView} aria-label="Fit to view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
        <Move className="h-3.5 w-3.5" />
        Drag to pan · Scroll to zoom · Click a card to open family
      </div>

      <div
        ref={containerRef}
        className={cn(
          'relative h-full min-h-[480px] touch-none overflow-hidden',
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        )}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, color-mix(in srgb, var(--color-border) 70%, transparent) 1px, transparent 1px)',
            backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />

        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={layout.width}
            height={layout.height}
          >
            {connectors.map(({ key, path }) => (
              <path
                key={key}
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-primary/35"
              />
            ))}
          </svg>

          {layout.nodes.map((node) => (
            <TreeNodeCard
              key={node.headId}
              node={node}
              selected={selectedHeadId === node.headId}
              onSelect={() => onSelectHead(node.headId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeNodeCard({
  node,
  selected,
  onSelect,
}: {
  node: FamilyTreeNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const left = node.x - TREE_CARD_WIDTH / 2;
  const top = node.y;

  return (
    <button
      type="button"
      data-tree-node
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute flex flex-col rounded-xl border bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary ring-2 ring-primary/30 shadow-md'
          : 'border-border hover:border-primary/40'
      )}
      style={{
        left,
        top,
        width: TREE_CARD_WIDTH,
        height: TREE_CARD_HEIGHT,
      }}
    >
      <div className="h-1 rounded-t-xl bg-gradient-to-r from-primary/50 via-accent to-primary/30" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/15">
            <AvatarImage src={node.headMember.profile_image_url ?? undefined} />
            <AvatarFallback name={node.headMember.full_name} className="bg-primary/10 text-primary text-xs" />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{node.headMember.full_name}</p>
            <p className="text-[11px] text-muted-foreground">Gen {node.head.generation}</p>
          </div>
        </div>
        {node.spouse ? (
          <p className="truncate border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
            &amp; {node.spouse.full_name}
          </p>
        ) : (
          <p className="border-t border-dashed border-border/70 pt-2 text-[11px] italic text-muted-foreground/70">
            No spouse yet
          </p>
        )}
      </div>
    </button>
  );
}
