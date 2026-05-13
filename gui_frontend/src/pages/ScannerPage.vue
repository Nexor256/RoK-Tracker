<template>
  <div class="flex h-full flex-col">
    <Tabs v-model="tab" class="flex h-full flex-col">
      <TabsList class="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="kingdom"
          class="rounded-none border-b-2 border-transparent transition-colors duration-200 hover:border-muted-foreground/30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Kingdom
        </TabsTrigger>
        <TabsTrigger
          value="seed"
          class="rounded-none border-b-2 border-transparent transition-colors duration-200 hover:border-muted-foreground/30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Seed
        </TabsTrigger>
        <TabsTrigger
          value="honor"
          class="rounded-none border-b-2 border-transparent transition-colors duration-200 hover:border-muted-foreground/30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Honor
        </TabsTrigger>
        <TabsTrigger
          value="alliance"
          class="rounded-none border-b-2 border-transparent transition-colors duration-200 hover:border-muted-foreground/30 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Alliance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kingdom" class="flex-1 overflow-auto p-4">
        <KingdomScanner />
      </TabsContent>
      <TabsContent value="seed" class="flex-1 overflow-auto p-4">
        <BatchScanner batch-type="Seed" />
      </TabsContent>
      <TabsContent value="honor" class="flex-1 overflow-auto p-4">
        <BatchScanner batch-type="Honor" />
      </TabsContent>
      <TabsContent value="alliance" class="flex-1 overflow-auto p-4">
        <BatchScanner batch-type="Alliance" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import KingdomScanner from '@/components/KingdomScanner.vue'
import BatchScanner from '@/components/BatchScanner.vue'

const tab = ref('kingdom')
</script>
