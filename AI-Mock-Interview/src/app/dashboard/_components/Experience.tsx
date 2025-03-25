"use client";

import {
  Award,
  Briefcase,
  Clock1,
  Code,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { addExperiences } from "@/app/actions/addExperience";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FaAudioDescription } from "react-icons/fa";

function ExperienceSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm({
    defaultValues: {
      experiences: [
        {
          company: "",
          role: "",
          duration: "",
          description: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "experiences",
    control: form.control,
  });

  const addExperience = () => {
    append({
      company: "",
      role: "",
      duration: "",
      description: "",
    });
  };

  const removeExperience = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (values: any) => {
    console.log(values);
    startTransition(() => {
      addExperiences(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
            setSuccess(undefined);
          } else if (data.success) {
            setSuccess(data.success);
            setError(undefined);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center text-gray-200">
      <div className="py-8 w-full max-w-7xl px-4 sm:px-6">
        {/* Header Section */}
        <header className="mb-8 sm:mb-10 flex items-center justify-between border-b border-gray-700 pb-6">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <div className="bg-purple-900 bg-opacity-70 p-3 rounded-xl shadow-lg">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Work Experience
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">
                Showcase your professional journey
              </p>
            </div>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg text-green-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden"
              >
                {/* Gradient Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                
                {/* Card Number Badge */}
                <div className="absolute top-4 right-4 bg-gray-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                  #{index + 1}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.company`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2 text-purple-300">
                          <Briefcase className="w-5 h-5 text-purple-400" />
                          Company Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your company name"
                            className="bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg text-gray-200 placeholder-gray-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`experiences.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2 text-purple-300">
                          <Code className="w-5 h-5 text-purple-400" />
                          Role
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Software Engineer"
                            className="bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg text-gray-200 placeholder-gray-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`experiences.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel className="text-base font-semibold flex items-center gap-2 text-purple-300">
                        <FaAudioDescription className="w-5 h-5 text-purple-400" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Describe your responsibilities and achievements"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-base min-h-32 focus:border-purple-500 focus:ring-purple-500 text-gray-200 placeholder-gray-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.duration`}
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel className="text-base font-semibold flex items-center gap-2 text-purple-300">
                        <Clock1 className="w-5 h-5 text-purple-400" />
                        Duration
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Jan 2022 - Present"
                          className="bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500 rounded-lg text-gray-200 placeholder-gray-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-gray-700">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-base text-red-400 hover:text-red-300 bg-gray-900 rounded-lg hover:bg-gray-950 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" /> Remove Experience
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addExperience}
                    className="flex-1 py-3 flex items-center justify-center gap-2 text-base text-purple-300 hover:text-purple-200 bg-gray-900 rounded-lg hover:bg-gray-950 transition-colors"
                  >
                    <Plus className="w-5 h-5" /> Add Experience
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-colors px-4 py-3 rounded-lg shadow-lg text-base font-medium"
            >
              {isPending ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save All Experiences
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default ExperienceSettingsPage;