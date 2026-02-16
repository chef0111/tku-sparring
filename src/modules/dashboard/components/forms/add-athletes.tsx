import * as React from 'react';
import { IconGripVertical, IconPlus } from '@tabler/icons-react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import type { z } from 'zod';
import type { DragEndEvent } from '@dnd-kit/core';

import { AddAthletesSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';

import { SelectItem } from '@/components/ui/select';
import { beltLevels } from '@/modules/dashboard/tournament/common/constant';
import { useAppForm } from '@/components/form/hooks';

type AddAthletesFormData = z.infer<typeof AddAthletesSchema>;

function SortableAthleteRow({
  id,
  children,
}: {
  id: string;
  children: (props: {
    dragHandleProps: Record<string, unknown>;
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-background flex items-start gap-2 rounded-md border p-2 ${isDragging ? 'opacity-50' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}

interface AddAthletesFormProps {
  onSubmit: (
    athletes: Array<{
      code: string;
      name: string;
      beltLevel: string;
      weight: string;
      affiliation: string;
    }>
  ) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function AddAthletesForm({
  onSubmit,
  onCancel,
  isPending,
}: AddAthletesFormProps) {
  const form = useAppForm({
    defaultValues: {
      athletes: [
        {
          code: '',
          name: '',
          beltLevel: '',
          weight: '',
          affiliation: '',
        },
      ],
    } satisfies AddAthletesFormData as AddAthletesFormData,
    validators: {
      onSubmit: AddAthletesSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.athletes);
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="athletes" mode="array">
          {(field) => {
            const rowIds = field.state.value.map(
              (_: unknown, i: number) => `athlete-${i}`
            );

            const handleDragEnd = (event: DragEndEvent) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                const oldIndex = rowIds.indexOf(String(active.id));
                const newIndex = rowIds.indexOf(String(over.id));
                const reordered = arrayMove(
                  [...field.state.value],
                  oldIndex,
                  newIndex
                );
                form.setFieldValue('athletes', reordered);
              }
            };

            return (
              <FieldSet>
                <FieldGroup className="flex w-full flex-row items-center justify-between gap-2">
                  <FieldContent>
                    <FieldLegend variant="label" className="mb-0 text-lg!">
                      Athletes
                    </FieldLegend>
                    <FieldDescription>
                      All fields are required. Drag to reorder.
                    </FieldDescription>
                    {field.state.meta.errors && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      field.pushValue({
                        code: '',
                        name: '',
                        beltLevel: '',
                        weight: '',
                        affiliation: '',
                      })
                    }
                  >
                    <IconPlus className="mr-1 size-3.5" />
                    Add Athlete
                  </Button>
                </FieldGroup>

                <DndContext
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rowIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {field.state.value.map((_: unknown, index: number) => (
                      <SortableAthleteRow
                        key={`athlete-${index}`}
                        id={`athlete-${index}`}
                      >
                        {({ dragHandleProps }) => (
                          <>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground mx-1 my-auto shrink-0 cursor-grab active:cursor-grabbing"
                              {...dragHandleProps}
                            >
                              <IconGripVertical className="size-4" />
                            </button>

                            <Field className="z-10 my-auto flex w-full flex-row items-center justify-between gap-2">
                              <form.AppField name={`athletes[${index}].code`}>
                                {(innerField) => (
                                  <innerField.Input
                                    placeholder="Athlete ID"
                                    fieldClassName="md:max-w-44 w-full"
                                    errorMessage={false}
                                  />
                                )}
                              </form.AppField>

                              <form.AppField name={`athletes[${index}].name`}>
                                {(innerField) => (
                                  <innerField.Input
                                    placeholder="Athlete name"
                                    fieldClassName="md:min-w-44 lg:min-w-60 w-full"
                                    errorMessage={false}
                                  />
                                )}
                              </form.AppField>

                              <form.AppField
                                name={`athletes[${index}].beltLevel`}
                              >
                                {(innerField) => (
                                  <innerField.Select
                                    className="w-full"
                                    placeholder="Select belt"
                                    errorMessage={false}
                                  >
                                    {beltLevels.map((level) => (
                                      <SelectItem
                                        key={level.value}
                                        value={level.value}
                                      >
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </innerField.Select>
                                )}
                              </form.AppField>

                              <form.AppField name={`athletes[${index}].weight`}>
                                {(innerField) => (
                                  <div className="relative flex w-full items-center lg:max-w-24 lg:min-w-24">
                                    <innerField.Input
                                      type="number"
                                      placeholder="Weight"
                                      className="pr-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      errorMessage={false}
                                    />
                                    <span className="bg-accent text-muted-foreground absolute right-0 bottom-0 m-px flex h-8.5 items-center rounded-r-md px-2 text-sm">
                                      kg
                                    </span>
                                  </div>
                                )}
                              </form.AppField>

                              <form.AppField
                                name={`athletes[${index}].affiliation`}
                              >
                                {(innerField) => (
                                  <innerField.Input
                                    placeholder="Affiliation name"
                                    fieldClassName="lg:min-w-60 w-full"
                                    errorMessage={false}
                                  />
                                )}
                              </form.AppField>
                            </Field>

                            {field.state.value.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => field.removeValue(index)}
                                className="text-muted-foreground hover:text-destructive my-auto shrink-0"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </SortableAthleteRow>
                    ))}
                  </SortableContext>
                </DndContext>
              </FieldSet>
            );
          }}
        </form.Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !form.state.isFormValid}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
