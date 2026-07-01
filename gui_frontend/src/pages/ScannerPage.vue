<template>
  <div class="flex h-full flex-col">
    <Tabs v-model="tab" class="flex h-full flex-col">
      <div class="px-4 pt-3 pb-2">
        <TabsList
          class="inline-flex w-auto gap-1 rounded-full bg-muted/60 p-1 backdrop-blur-sm ring-1 ring-border/40"
        >
          <TabsTrigger
            value="kingdom"
            class="gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
          >
            <Crown class="h-4 w-4" />
            Kingdom
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            class="gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
          >
            <Layers class="h-4 w-4" />
            Seed / Alliance / Honor
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="kingdom"
        class="flex-1 px-4 pb-4 pt-2 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0"
      >
        <KingdomScanner class="flex-1 min-h-0" />
      </TabsContent>
      <TabsContent
        value="batch"
        class="flex-1 flex flex-col gap-4 p-4 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col min-h-0"
      >
        <!-- Batch type selector header -->
        <div
          class="flex items-center gap-4 rounded-lg border border-border/60 dark:border-border/40 bg-muted/40 dark:bg-muted/15 backdrop-blur-md px-4 py-3 shadow-sm"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-border/30 shadow-sm transition-colors duration-200"
            :class="batchTypeStyles[selectedBatchType].badge"
          >
            <component :is="batchTypeStyles[selectedBatchType].icon" class="h-4.5 w-4.5" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scanner Type</span>
            <Select v-model="selectedBatchType">
              <SelectTrigger class="mt-1 w-56">
                <SelectValue placeholder="Select scanner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Seed">
                  <span class="flex items-center gap-2"><Sprout class="h-4 w-4 text-emerald-500" /> Seed</span>
                </SelectItem>
                <SelectItem value="Honor">
                  <span class="flex items-center gap-2"><Award class="h-4 w-4 text-amber-500" /> Honor</span>
                </SelectItem>
                <SelectItem value="Alliance">
                  <span class="flex items-center gap-2"><Shield class="h-4 w-4 text-sky-500" /> Alliance</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge
            variant="outline"
            class="shrink-0 text-xs font-medium transition-colors duration-200"
            :class="batchTypeStyles[selectedBatchType].badgeText"
          >
            {{ selectedBatchType }} Scanner
          </Badge>
        </div>

        <!-- Batch scanner content -->
        <BatchScanner :key="selectedBatchType" :batch-type="selectedBatchType" class="flex-1 min-h-0" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Crown, Sprout, Award, Shield, Layers } from 'lucide-vue-next'
import KingdomScanner from '@/components/KingdomScanner.vue'
import BatchScanner from '@/components/BatchScanner.vue'
import type { BatchType } from '@/schema/BatchType'

defineOptions({ name: 'ScannerPage' })

const tab = ref('kingdom')
const selectedBatchType = ref<BatchType['type']>('Seed')

const batchTypeStyles = {
  Seed: {
    icon: markRaw(Sprout),
    badge: 'bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-emerald-500/40 dark:ring-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/50 dark:border-emerald-500/30',
  },
  Honor: {
    icon: markRaw(Award),
    badge: 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-amber-500/40 dark:ring-amber-500/20',
    badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/50 dark:border-amber-500/30',
  },
  Alliance: {
    icon: markRaw(Shield),
    badge: 'bg-sky-500/15 dark:bg-sky-500/10 text-sky-600 dark:text-sky-500 ring-sky-500/40 dark:ring-sky-500/20',
    badgeText: 'text-sky-700 dark:text-sky-400 border-sky-500/50 dark:border-sky-500/30',
  },
} as const
</script>
